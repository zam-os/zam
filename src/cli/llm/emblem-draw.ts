/**
 * The Studio's way to a Sinnbild (ADR 2026-10-13, Decision 6): the first
 * connected text model draws one for a unit or region, by its title and its
 * place. SVG is text, so any text model can.
 *
 * - Only the title and the path go to the model, the same egress as every
 *   model call (ADR 2026-10-13, Decision 2; `llm.endpoints` confines it).
 * - The answer is untrusted: it is validated like every other Sinnbild, and
 *   a refused drawing is sent back once with the validator's reason.
 * - Harness-backed rows are left out: an agent draws through
 *   `zam_atlas_set_emblem` instead.
 */

import {
  type Database,
  EMBLEM_MAX_CHARS,
  endpointUrl,
  GLYPH_MAX_CHARS,
  mapEndpointPath,
  validateEmblem,
} from "../../kernel/index.js";
import {
  DEFAULT_LLM_API_KEY,
  fetchWithInteractiveTimeout,
  isNoAnswerFailure,
  LlmHttpError,
  type ProviderConfig,
  prepareFoundryEndpoint,
  providerChain,
  readChatContent,
  resolveCapability,
} from "./client.js";

const DRAW_TIMEOUT_MS = 2 * 60 * 1000;
const DRAW_MAX_TOKENS = 3000;

export class EmblemDrawError extends Error {
  constructor(
    readonly code: "no-text-model" | "model-failed" | "invalid-answer",
    message: string,
  ) {
    super(message);
    this.name = "EmblemDrawError";
  }
}

export interface EmblemDrawDeps {
  /** Injected in tests; defaults to the interactive-timeout fetch. */
  fetch?: (
    url: string,
    init: RequestInit & {
      locale?: ProviderConfig["locale"];
      hardTimeoutMs?: number;
    },
  ) => Promise<Response>;
}

export interface EmblemDrawing {
  /** The canonical SVG. */
  svg: string;
  glyph: string | null;
  model: string;
}

/** What makes a Sinnbild pass and read well; agents get the same list. */
export const EMBLEM_RULES: readonly string[] = [
  'The root is <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">, with no width or height.',
  "Only these elements: svg, g, path, circle, ellipse, rect, line, polyline, polygon, text, tspan.",
  "Only these attributes: d, points, x, y, x1, y1, x2, y2, cx, cy, r, rx, ry, width, height, transform, fill, fill-opacity, stroke, stroke-width, stroke-linecap, stroke-linejoin, stroke-opacity, opacity, font-size, font-weight, text-anchor.",
  'Colours as #rrggbb or "none". No style, class, id, href, url(), gradients, filters, comments, scripts or entities.',
  "Bold and simple: a few shapes, strokes 2 to 4 wide, at most three colours plus a dark ink (#1d2b4f) on a light disc. It must read at 24 pixels, so no fine detail and at most a few characters of text.",
  `At most ${EMBLEM_MAX_CHARS} characters.`,
  `Optionally a glyph: a formula, symbol or short sign of at most ${GLYPH_MAX_CHARS} characters, such as "a² + b² = c²" or "H₂O". Leave it out when nothing fits.`,
];

export const EMBLEM_DRAW_INSTRUCTIONS = `You draw a Sinnbild: a small, simple icon that helps a learner recognise one piece of knowledge at a glance, like a pictogram on a map.

Rules:
${EMBLEM_RULES.map((rule) => `- ${rule}`).join("\n")}

Answer with JSON only: {"svg": "<svg …>…</svg>", "glyph": "…"}`;

/** The rows a drawing may go to: direct HTTP, in the registry's order. */
async function textChain(db: Database): Promise<ProviderConfig[]> {
  const primary = await resolveCapability(db, "text");
  if (!primary) return [];
  return providerChain(primary).filter((row) => row.transport !== "agent");
}

/** `{svg, glyph}` from a model's answer, tolerating a code fence around it. */
export function parseEmblemReply(text: string): { svg: string; glyph: string } {
  const unfenced = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const value = JSON.parse(unfenced.slice(start, end + 1)) as {
        svg?: unknown;
        glyph?: unknown;
      };
      if (typeof value.svg === "string") {
        return {
          svg: value.svg,
          glyph: typeof value.glyph === "string" ? value.glyph : "",
        };
      }
    } catch {
      // Not JSON: perhaps the bare SVG.
    }
  }
  const svg = /<svg[\s\S]*<\/svg>/.exec(unfenced);
  if (svg) return { svg: svg[0], glyph: "" };
  throw new EmblemDrawError(
    "invalid-answer",
    "The model's answer held no SVG.",
  );
}

async function readAnthropicText(res: Response): Promise<string> {
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new LlmHttpError("Sinnbild", res.status, res.statusText, errorText);
  }
  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = data.content
    ?.filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();
  if (!text) throw new Error("Empty response from the model");
  return text;
}

async function ask(
  row: ProviderConfig,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  deps: EmblemDrawDeps,
): Promise<string> {
  const endpoint = await prepareFoundryEndpoint(row);
  const apiKey = endpoint.apiKey || DEFAULT_LLM_API_KEY;
  const anthropic = endpoint.apiFlavor === "anthropic-messages";
  const send = deps.fetch ?? fetchWithInteractiveTimeout;
  if (anthropic) {
    const res = await send(
      mapEndpointPath(
        endpoint.url,
        (path) => `${path.replace(/\/v1$/, "")}/v1/messages`,
      ),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: endpoint.model,
          max_tokens: DRAW_MAX_TOKENS,
          system: EMBLEM_DRAW_INSTRUCTIONS,
          messages,
        }),
        locale: endpoint.locale,
        hardTimeoutMs: DRAW_TIMEOUT_MS,
      },
    );
    return readAnthropicText(res);
  }
  const res = await send(endpointUrl(endpoint.url, "chat/completions"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: endpoint.model,
      messages: [
        { role: "system", content: EMBLEM_DRAW_INSTRUCTIONS },
        ...messages,
      ],
      temperature: 0.6,
      max_tokens: DRAW_MAX_TOKENS,
    }),
    locale: endpoint.locale,
    hardTimeoutMs: DRAW_TIMEOUT_MS,
  });
  return readChatContent(res, "Sinnbild");
}

/**
 * Draw a Sinnbild for one subject. Walks the text chain like the other model
 * paths: a row that fails hands the request to the next, and a local row
 * behind a cloud primary serves only when no cloud row answered.
 */
export async function drawEmblemViaLLM(
  db: Database,
  subject: { title: string; path: string[] },
  deps: EmblemDrawDeps = {},
): Promise<EmblemDrawing> {
  const rows = await textChain(db);
  if (rows.length === 0) {
    throw new EmblemDrawError("no-text-model", "No text model is connected.");
  }
  const request = [
    `Draw the Sinnbild for this learning unit or area: ${subject.title}`,
    subject.path.length > 0 ? `It sits under: ${subject.path.join(" › ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  let lastError: unknown;
  let cloudAnswered = false;
  for (const row of rows) {
    if (row.offlineOnly && cloudAnswered) break;
    try {
      const messages: Array<{ role: "user" | "assistant"; content: string }> = [
        { role: "user", content: request },
      ];
      // One correction round: the validator's reason goes back to the model.
      for (let attempt = 0; attempt < 2; attempt++) {
        const answer = await ask(row, messages, deps);
        let reason: string;
        try {
          const reply = parseEmblemReply(answer);
          const checked = validateEmblem(reply.svg, reply.glyph);
          if (checked.ok) {
            return {
              svg: checked.canonical,
              glyph: checked.glyph,
              model: row.model,
            };
          }
          reason = checked.error;
        } catch (error) {
          reason = error instanceof Error ? error.message : String(error);
        }
        lastError = new EmblemDrawError("invalid-answer", reason);
        messages.push(
          { role: "assistant", content: answer },
          {
            role: "user",
            content: `That drawing was refused: ${reason} Answer again with JSON only, following every rule.`,
          },
        );
      }
      cloudAnswered ||= !row.offlineOnly;
    } catch (error) {
      lastError = error;
      if (!row.offlineOnly && !isNoAnswerFailure(error)) cloudAnswered = true;
    }
  }
  if (lastError instanceof EmblemDrawError) throw lastError;
  const reason =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new EmblemDrawError(
    "model-failed",
    `The model could not draw: ${reason}`,
  );
}
