/**
 * Private Academy providers (ADR 2026-11-25, Decisions 2 and 5).
 *
 * A provider is an Academy on its own origin. It names itself, its login and
 * an optional report link in `https://<origin>/zam-provider.json`. This module
 * only parses and checks that file and builds the two strings ZAM derives from
 * it (the token scope and a report link). Fetching, the token and the
 * learner's confirmation live in the CLI (`src/cli/academy/`); the kernel has
 * no HTTP.
 *
 * The file is library-independent, untrusted content: everything here is
 * strict, and the token scope is built from a GUID, never taken from the file.
 */

import type { Database } from "../db/types.js";
import { providerOrigin } from "./academy-catalog.js";
import { BUNDLED_TILES } from "./bundled-cells.js";

/** The fixed path of the provider file on every provider origin. */
export const ACADEMY_PROVIDER_FILE = "/zam-provider.json";

/** The public ZAM Academy's tile-id prefix, reserved for it. */
export const ZAM_ACADEMY_PREFIX = "zam-academy";

export type AcademyProviderAuth =
  | { kind: "none" }
  | {
      kind: "entra-cli";
      /** Microsoft Entra tenant id, lower-case GUID. */
      tenant: string;
      /** The app registration whose API scope the token is for, lower-case GUID. */
      api: string;
    };

export interface AcademyProvider {
  schema: 1;
  /** Slug; also the prefix of every tile id the provider publishes. */
  id: string;
  title: string;
  publisher: string;
  auth: AcademyProviderAuth;
  /** An https URL template with `{tile}`, `{item}`, `{version}`, or null. */
  feedback: string | null;
}

const PROVIDER_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;
const GUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const FEEDBACK_PLACEHOLDERS = new Set(["tile", "item", "version"]);
const MAX_TITLE = 80;
const MAX_PUBLISHER = 120;
const MAX_FEEDBACK = 500;
/**
 * Control characters and bidirectional controls: a confirmation dialog must
 * show the learner exactly what they confirm.
 */
// biome-ignore lint/suspicious/noControlCharactersInRegex: the point is to find them
const UNSAFE_TEXT = /[\u0000-\u001f\u007f‎‏‪-‮⁦-⁩]/;

/** Whether `value` is a GUID in the canonical lower-case form. */
export function isGuid(value: unknown): value is string {
  return typeof value === "string" && GUID.test(value);
}

/**
 * Checks a parsed `zam-provider.json`. Unknown keys are ignored; a missing or
 * invalid field fails the whole file. GUIDs are lower-cased before the check.
 */
export function parseAcademyProvider(raw: unknown): AcademyProvider {
  if (!isRecord(raw) || raw.schema !== 1) {
    throw new Error("Provider file: expected { schema: 1, ... }");
  }
  const id = typeof raw.id === "string" ? raw.id : "";
  if (!PROVIDER_ID.test(id)) {
    throw new Error("Provider file: id must be a slug of up to 40 characters");
  }
  const title = displayText(raw.title, MAX_TITLE, "title");
  const publisher = displayText(raw.publisher, MAX_PUBLISHER, "publisher");
  return {
    schema: 1,
    id,
    title,
    publisher,
    auth: parseAuth(raw.auth),
    feedback: parseFeedback(raw.feedback),
  };
}

function parseAuth(raw: unknown): AcademyProviderAuth {
  if (!isRecord(raw)) throw new Error("Provider file: auth is required");
  if (raw.kind === "none") return { kind: "none" };
  if (raw.kind !== "entra-cli") {
    throw new Error('Provider file: auth.kind must be "none" or "entra-cli"');
  }
  const tenant = guidField(raw.tenant, "auth.tenant");
  const api = guidField(raw.api, "auth.api");
  return { kind: "entra-cli", tenant, api };
}

function guidField(value: unknown, where: string): string {
  const lowered = typeof value === "string" ? value.toLowerCase() : "";
  if (!GUID.test(lowered)) {
    throw new Error(`Provider file: ${where} must be a GUID`);
  }
  return lowered;
}

function parseFeedback(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string" || !raw || raw.length > MAX_FEEDBACK) {
    throw new Error("Provider file: feedback must be an https URL template");
  }
  const authority = /^https:\/\/([^/?#\\]+)(?=[/?#]|$)/i.exec(raw)?.[1];
  if (!authority || /[{}]/.test(authority)) {
    throw new Error("Provider file: feedback must have a fixed https host");
  }
  // Every brace must open one allowed placeholder and close it again.
  const stripped = raw.replace(/\{([a-z]*)\}/g, (_, name: string) => {
    if (!FEEDBACK_PLACEHOLDERS.has(name)) {
      throw new Error(
        `Provider file: feedback may only use {tile}, {item} and {version}, not {${name}}`,
      );
    }
    return "x";
  });
  if (/[{}\s]/.test(stripped) || UNSAFE_TEXT.test(stripped)) {
    throw new Error("Provider file: feedback must be an https URL template");
  }
  let url: URL;
  try {
    url = new URL(stripped);
  } catch {
    throw new Error("Provider file: feedback must be an https URL template");
  }
  if (
    url.protocol !== "https:" ||
    !url.hostname ||
    url.username ||
    url.password
  ) {
    throw new Error("Provider file: feedback must be an https URL template");
  }
  return raw;
}

function displayText(value: unknown, max: number, where: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || text.length > max || UNSAFE_TEXT.test(text)) {
    throw new Error(
      `Provider file: ${where} must be plain text of up to ${max} characters`,
    );
  }
  return text;
}

/** The token scope for an `entra-cli` provider, built from its API GUID. */
export function providerTokenScope(auth: AcademyProviderAuth): string | null {
  if (auth.kind !== "entra-cli") return null;
  if (!isGuid(auth.api)) throw new Error("Provider api must be a GUID");
  return `api://${auth.api}/.default`;
}

/**
 * The report link for one card, or null when the provider has none. Only the
 * tile id, item id and tile version go in, each URL-encoded; nothing about
 * the question, the answer or the learner (ADR 2026-11-25 Decision 8).
 */
export function providerFeedbackUrl(
  provider: Pick<AcademyProvider, "feedback">,
  card: { tile: string; item: string; version: string },
): string | null {
  if (!provider.feedback) return null;
  const values: Record<string, string> = {
    tile: card.tile,
    item: card.item,
    version: card.version,
  };
  const filled = provider.feedback.replace(
    /\{(tile|item|version)\}/g,
    (_, name: string) => encodeURIComponent(values[name] ?? ""),
  );
  const url = new URL(filled);
  if (url.protocol !== "https:") return null;
  return url.href;
}

/**
 * Provider ids no provider may take: the public Academy's prefix and the
 * prefix of every tile this build bundles (ADR 2026-11-25 Decision 5).
 */
export function reservedProviderIds(): Set<string> {
  const reserved = new Set<string>([ZAM_ACADEMY_PREFIX]);
  for (const tileId of Object.keys(BUNDLED_TILES)) {
    const colon = tileId.indexOf(":");
    if (colon > 0) reserved.add(tileId.slice(0, colon));
  }
  return reserved;
}

/** Whether a tile id lies in the namespace `<providerId>:`. */
export function tileInNamespace(tileId: string, providerId: string): boolean {
  return (
    tileId.startsWith(`${providerId}:`) && tileId.length > providerId.length + 1
  );
}

export interface AcademyProviderIdentity {
  id: string;
  origin: string;
}

/** Pilot tiles stored the app URL, which was constrained to the provider origin. */
export function installedProviderOrigin(
  origin: string | null,
  appUrl: string | null,
): string | null {
  if (origin) return origin;
  try {
    return appUrl ? providerOrigin(new URL(appUrl).origin) : null;
  } catch {
    return null;
  }
}

/** All tiles in a library's provider namespace must come from one origin. */
export async function assertAcademyProviderOrigin(
  db: Database,
  provider: AcademyProviderIdentity,
): Promise<void> {
  if (
    !PROVIDER_ID.test(provider.id) ||
    reservedProviderIds().has(provider.id)
  ) {
    throw new Error(`Invalid or reserved provider id ${provider.id}`);
  }
  const origin = providerOrigin(provider.origin);
  const tiles = (await db
    .prepare(
      `SELECT provider_origin, app_url FROM installed_tiles
        WHERE tile_id LIKE ? AND version <> ''`,
    )
    .all(`${provider.id}:%`)) as Array<{
    provider_origin: string | null;
    app_url: string | null;
  }>;
  if (
    tiles.some(
      (row) =>
        installedProviderOrigin(row.provider_origin, row.app_url) !== origin,
    )
  ) {
    throw new Error(
      `PROVIDER_ORIGIN_MISMATCH: ${provider.id} is already installed in this library with a different or unrecorded origin`,
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
