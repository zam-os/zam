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
    title: "ZAM Learning Graph",
    toolName: "zam_show_graph",
    allowedTools: new Set(["zam_studio_bridge", "zam_companion_context"]),
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
  // `okf` deliberately omits `user`: `zam_okf_visualize` is repo-scoped
  // (unlike the learner-scoped apps), but forwards the requested initial view.
  const allowed =
    app === "recall"
      ? ["user", "domain"]
      : app === "graph"
        ? ["user", "focus"]
        : app === "okf"
          ? ["bundle_dir", "view"]
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

/**
 * Resolve the repository-relative part of a canonical GitHub blob URL.
 *
 * OKF article `resource` links use
 * `https://github.com/<owner>/<repo>/blob/main/<repo-path>`. The VS Code
 * Companion can use the returned, individually validated path segments to
 * prefer the matching local workspace file over opening the browser. Other
 * hosts still receive the original HTTPS URL through MCP Apps `ui/open-link`.
 */
export function githubMainBlobPath(url: string): string[] | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname.toLowerCase() !== "github.com" ||
    parsed.username !== "" ||
    parsed.password !== ""
  ) {
    return undefined;
  }

  // URL.pathname normalizes encoded dot segments before returning them. Read
  // the original escaped path so `%2e%2e` is rejected instead of silently
  // turning into a different, still workspace-contained local file.
  const rawPath =
    /^[a-z][a-z0-9+.-]*:\/\/[^/?#]+([^?#]*)/i.exec(url.trim())?.[1] ?? "";
  const rawSegments = rawPath.split("/").slice(1);
  if (
    rawSegments.length < 5 ||
    rawSegments[0] === "" ||
    rawSegments[1] === "" ||
    rawSegments[2] !== "blob" ||
    rawSegments[3] !== "main"
  ) {
    return undefined;
  }

  const path: string[] = [];
  for (const raw of rawSegments.slice(4)) {
    let segment: string;
    try {
      segment = decodeURIComponent(raw);
    } catch {
      return undefined;
    }
    // biome-ignore lint/suspicious/noControlCharactersInRegex: local editor paths must reject every ASCII control character
    const containsControlCharacter = /[\u0000-\u001f]/.test(segment);
    if (
      segment === "" ||
      segment === "." ||
      segment === ".." ||
      segment.includes("/") ||
      segment.includes("\\") ||
      containsControlCharacter
    ) {
      return undefined;
    }
    path.push(segment);
  }
  return path.length > 0 ? path : undefined;
}

// ── Companion / CLI version-drift guard ────────────────────────────────────

/**
 * The Companion VSIX (this extension) and the `zam mcp` server it spawns (the
 * global `zam-core` CLI) ship as independent artifacts, so a user can update
 * one and silently leave the other behind. That is exactly how the 0.15.0
 * CRLF-parse bug kept breaking the OKF panel after the VSIX had already been
 * updated to 0.15.1: the Companion kept launching the stale global server, and
 * nothing said so. This guard turns that silent drift into a loud, actionable
 * notice at connect time.
 */
export interface ServerVersionDrift {
  /** `server-older` is the dangerous case: a stale CLI behind a newer UI. */
  kind: "server-older" | "server-newer";
  extensionVersion: string;
  serverVersion: string;
  /** Ready-to-show sentence naming both versions and how to reconcile them. */
  message: string;
  /** The npm command that fixes a `server-older` drift; absent otherwise (the
   *  fix for `server-newer` is to update the extension, not run a command). */
  updateCommand?: string;
}

/**
 * Numeric `major.minor.patch` core of a semver, ignoring any prerelease/build
 * suffix. Returns null for anything without that core (e.g. an unreplaced
 * `__ZAM_VERSION__` in a dev build) so the guard degrades to "no opinion"
 * rather than raising a false alarm.
 */
function semverCore(
  version: string | undefined,
): [number, number, number] | null {
  if (typeof version !== "string") return null;
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version.trim());
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

function compareSemverCore(
  a: [number, number, number],
  b: [number, number, number],
): number {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

/**
 * Compare the Companion extension's own version with the version the spawned
 * `zam mcp` server reports. Returns a drift descriptor when they differ, or
 * null when they match or either version is unreadable (never block or warn on
 * a version we cannot parse).
 */
export function describeServerVersionDrift(
  extensionVersion: string,
  serverVersion: string | undefined,
): ServerVersionDrift | null {
  if (serverVersion === undefined) return null;
  const ext = semverCore(extensionVersion);
  const srv = semverCore(serverVersion);
  if (!ext || !srv) return null;
  const cmp = compareSemverCore(srv, ext);
  if (cmp === 0) return null;
  if (cmp < 0) {
    const updateCommand = `npm install -g zam-core@${extensionVersion}`;
    return {
      kind: "server-older",
      extensionVersion,
      serverVersion,
      updateCommand,
      message:
        `ZAM Companion is ${extensionVersion} but its "zam mcp" CLI is ` +
        `${serverVersion}. The panels run against the CLI, so features can ` +
        `silently misbehave until it matches — update it with ` +
        `\`${updateCommand}\`, then reload the window.`,
    };
  }
  return {
    kind: "server-newer",
    extensionVersion,
    serverVersion,
    message:
      `ZAM Companion is ${extensionVersion} but its "zam mcp" CLI is already ` +
      `${serverVersion}. Update the ZAM Companion extension to ${serverVersion} ` +
      `and reload the window so the UI matches the CLI.`,
  };
}
