import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export type CompanionApp = "recall" | "graph" | "settings";

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

export const COMPANION_APPS: Record<CompanionApp, CompanionAppConfig> = {
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
  settings: {
    title: "ZAM Settings",
    toolName: "zam_open_settings",
    allowedTools: new Set(["zam_studio_bridge"]),
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
  const allowed =
    app === "recall"
      ? ["user", "domain"]
      : app === "graph"
        ? ["user", "focus"]
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
