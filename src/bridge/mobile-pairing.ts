/** Versioned wire contract carried by the desktop pairing QR code. */

export const ZAM_PAIR_TYPE = "zam-pair" as const;
export const ZAM_PAIR_VERSION = 1 as const;
// QrCode's default medium error correction tops out at 2,331 byte-mode bytes.
// Keep headroom so every accepted contract is renderable as one QR code.
export const ZAM_PAIR_MAX_BYTES = 2_000;

export type ZamPairApiFlavor = "chat-completions" | "anthropic-messages";

export interface ZamPairLlmEndpoint {
  enabled: boolean;
  url: string;
  model: string;
  apiFlavor: ZamPairApiFlavor;
  apiKey?: string;
  local: boolean;
  label?: string;
  fallback?: ZamPairLlmEndpoint;
}

export interface ZamPairPayloadV1 {
  type: typeof ZAM_PAIR_TYPE;
  version: typeof ZAM_PAIR_VERSION;
  createdAt: string;
  database: {
    url: string;
    token: string;
  };
  learner: {
    userId: string;
  };
  llm?: {
    recall: ZamPairLlmEndpoint;
  };
  settings?: {
    locale?: string;
  };
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function optionalString(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  return requiredString(value, label);
}

function validateUrl(value: unknown, label: string): string {
  const url = requiredString(value, label);
  try {
    const parsed = new URL(url);
    if (!parsed.protocol || !parsed.hostname) throw new Error("missing host");
  } catch {
    throw new Error(`${label} must be an absolute URL`);
  }
  return url;
}

function validateDatabaseUrl(value: unknown): string {
  const url = validateUrl(value, "database.url");
  const protocol = new URL(url).protocol;
  if (protocol !== "libsql:" && protocol !== "https:") {
    throw new Error("database.url must use libsql or https");
  }
  return url;
}

function parseLlmEndpoint(value: unknown, depth = 0): ZamPairLlmEndpoint {
  if (depth > 4) throw new Error("llm fallback chain is too deep");
  const source = record(value, "llm.recall");
  const apiFlavor = requiredString(source.apiFlavor, "llm.recall.apiFlavor");
  if (apiFlavor !== "chat-completions" && apiFlavor !== "anthropic-messages") {
    throw new Error("llm.recall.apiFlavor is unsupported");
  }
  if (
    typeof source.enabled !== "boolean" ||
    typeof source.local !== "boolean"
  ) {
    throw new Error("llm.recall enabled/local flags must be booleans");
  }

  const apiKey = optionalString(source.apiKey, "llm.recall.apiKey");
  const label = optionalString(source.label, "llm.recall.label");

  return {
    enabled: source.enabled,
    url: validateUrl(source.url, "llm.recall.url"),
    model: requiredString(source.model, "llm.recall.model"),
    apiFlavor,
    ...(apiKey ? { apiKey } : {}),
    local: source.local,
    ...(label ? { label } : {}),
    ...(source.fallback
      ? { fallback: parseLlmEndpoint(source.fallback, depth + 1) }
      : {}),
  };
}

/** Parse and validate untrusted QR/manual input before any credential is used. */
export function parseZamPairPayload(input: string | unknown): ZamPairPayloadV1 {
  let value = input;
  if (typeof input === "string") {
    if (new TextEncoder().encode(input).byteLength > ZAM_PAIR_MAX_BYTES) {
      throw new Error("pairing payload is too large");
    }
    try {
      value = JSON.parse(input);
    } catch {
      throw new Error("pairing code is not valid JSON");
    }
  }

  const source = record(value, "pairing payload");
  if (source.type !== ZAM_PAIR_TYPE || source.version !== ZAM_PAIR_VERSION) {
    throw new Error("unsupported pairing payload type or version");
  }
  const createdAt = requiredString(source.createdAt, "createdAt");
  if (Number.isNaN(Date.parse(createdAt))) {
    throw new Error("createdAt must be an ISO timestamp");
  }

  const database = record(source.database, "database");
  const learner = record(source.learner, "learner");
  const settings = source.settings
    ? record(source.settings, "settings")
    : undefined;
  const llm = source.llm ? record(source.llm, "llm") : undefined;
  const locale = settings
    ? optionalString(settings.locale, "settings.locale")
    : undefined;

  const payload: ZamPairPayloadV1 = {
    type: ZAM_PAIR_TYPE,
    version: ZAM_PAIR_VERSION,
    createdAt,
    database: {
      url: validateDatabaseUrl(database.url),
      token: requiredString(database.token, "database.token"),
    },
    learner: {
      userId: requiredString(learner.userId, "learner.userId"),
    },
    ...(llm ? { llm: { recall: parseLlmEndpoint(llm.recall) } } : {}),
    ...(settings
      ? {
          settings: {
            ...(locale ? { locale } : {}),
          },
        }
      : {}),
  };
  if (
    new TextEncoder().encode(JSON.stringify(payload)).byteLength >
    ZAM_PAIR_MAX_BYTES
  ) {
    throw new Error("pairing payload is too large");
  }
  return payload;
}

export function serializeZamPairPayload(payload: ZamPairPayloadV1): string {
  return JSON.stringify(parseZamPairPayload(payload));
}
