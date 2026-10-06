/**
 * What every producer of material-import proposals is told (ADR 2026-10-05):
 * the agent on the harness path through the MCP tools, and the model on the
 * built-in path through one request built here.
 *
 * HTTP-free and free of Node built-ins: Mobile imports this module into its
 * WebView bundle, as it already does `choice-prompt.ts`. The caller owns the
 * transport, the files and the validation (`parseMaterialProposalSet`).
 */

import {
  MATERIAL_KINDS,
  MATERIAL_ORIGINS,
  MATERIAL_PROPOSAL_SET_VERSION,
} from "../../kernel/import/material-contract.js";
import { languageName } from "../../kernel/system/language-names.js";

/** Photos per import on the built-in path (D3). */
export const MAX_IMAGES_PER_REQUEST = 10;
/** Long edge photos are scaled to before sending, where the platform can (D1). */
export const IMAGE_LONG_EDGE_PX = 1568;
/**
 * Output budget, reasoning included. A page of notes can yield dozens of
 * cards, and reasoning models spend tokens thinking first. A budget caps, it
 * does not bill — only tokens actually used cost.
 */
export const MATERIAL_MAX_OUTPUT_TOKENS = 16_000;

/** The harness can ask back; a single request cannot. */
export type MaterialPath = "harness" | "built-in";

// ── What one built-in import takes (D3) ─────────────────────────────────────

export type MaterialFileKind = "image" | "heic" | "pdf" | "other";

/** By the file name's extension; works for paths and bare names alike. */
export function materialFileKind(name: string): MaterialFileKind {
  const dot = name.lastIndexOf(".");
  const ext = dot < 0 ? "" : name.slice(dot + 1).toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "heic" || ext === "heif") return "heic";
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
    ? "image"
    : "other";
}

export type MaterialSelectionCode =
  | "no-files"
  | "unsupported"
  | "mixed"
  | "one-pdf"
  | "too-many";

/** Up to {@link MAX_IMAGES_PER_REQUEST} photos, or one PDF — never both. */
export function materialSelection(names: string[]): MaterialSelection {
  return materialSelectionOfKinds(names.map(materialFileKind));
}

export type MaterialSelection =
  | { ok: true; kind: "image" | "pdf" }
  | { ok: false; code: MaterialSelectionCode; message: string };

/**
 * The same rule over kinds already known — a phone's camera photo carries a
 * MIME type, not always a telling file name.
 */
export function materialSelectionOfKinds(
  kinds: MaterialFileKind[],
): MaterialSelection {
  if (kinds.length === 0) {
    return { ok: false, code: "no-files", message: "Choose a photo or a PDF." };
  }
  if (kinds.includes("other")) {
    return {
      ok: false,
      code: "unsupported",
      message: "Only photos (JPEG, PNG, WebP, HEIC) and PDFs can be imported.",
    };
  }
  const pdfs = kinds.filter((kind) => kind === "pdf").length;
  if (pdfs > 0 && pdfs < kinds.length) {
    return {
      ok: false,
      code: "mixed",
      message: "Import photos and a PDF in separate runs.",
    };
  }
  if (pdfs > 1) {
    return { ok: false, code: "one-pdf", message: "Import one PDF at a time." };
  }
  if (pdfs === 0 && kinds.length > MAX_IMAGES_PER_REQUEST) {
    return {
      ok: false,
      code: "too-many",
      message: `At most ${MAX_IMAGES_PER_REQUEST} photos per import.`,
    };
  }
  return { ok: true, kind: pdfs === 1 ? "pdf" : "image" };
}

/** The rules, one per line, in the order the producer applies them. */
export function materialCardRules(path: MaterialPath): string[] {
  return [
    "Read the material itself — the image or PDF, never a transcript of it. Layout carries meaning: columns, arrows, highlighted headings.",
    path === "harness"
      ? "Before you propose, ask the learner about what you cannot read or place: an illegible word, the lesson or subject, what an arrow or a heading refers to."
      : "You cannot ask back in this request: set hardToRead on a card whose handwriting you are not sure of, and leave out what you cannot place at all.",
    path === "harness"
      ? "Analyse first: the kind of material, its subject (use the subject codes from zam_material_import_context), topic, school level and depth, and what it leads to."
      : "Analyse first: the kind of material, its subject (use the subject codes listed below), topic, school level and depth, and what it leads to.",
    "One card per retrieval target: a question with one clear answer. Prefer several focused cards over one broad card.",
    "Set each card's origin honestly — page: stated on the page; completed: explains, justifies or corrects a statement on the page; extra: related knowledge the page does not state.",
    "Set hardToRead on a card when you are not sure you read the handwriting right.",
    "Over-delivery is fine: the learner deselects. You never decide for the learner — you propose, and the learner chooses Yes, No or Bonus in ZAM's review list.",
    "One subject per import. If a page still mixes subjects, give each card its own area; the review groups the cards by area.",
    "Reuse an existing area path where it fits. A new path starts with the subject (chemie/stoffe), never with a life area such as schule/.",
    "Write the cards in the material's language.",
  ];
}

/** The harness path's rules, as `zam_material_import_context` returns them. */
export const MATERIAL_CARD_RULES: readonly string[] =
  materialCardRules("harness");

/** The shape `zam_material_import` takes, shown to agents as an example. */
export const MATERIAL_CONTRACT_EXAMPLE = {
  analysis: {
    kind: "own-notes",
    title: "Stofferkennung mit den Sinnen",
    subjects: ["chemie"],
    topic: "Stoffe und Stoffeigenschaften",
    level: "Realschule, Anfangsunterricht Chemie",
    bloom: [1, 2],
    leadsTo:
      "Messbare Stoffeigenschaften: Dichte, Schmelz- und Siedetemperatur",
  },
  proposals: [
    {
      question: "Welche Eigenschaften eines Stoffes erkennt man am Aussehen?",
      answer: "Farbe, Aggregatzustand bei Raumtemperatur, metallischer Glanz.",
      title: "Stofferkennung am Aussehen",
      bloom: 1,
      file: 0,
      page: 1,
      area: "chemie/stoffe-und-eigenschaften",
      origin: "page",
      hardToRead: false,
    },
  ],
  files: [
    { name: "IMG_1234.jpg", path: "/Users/learner/Desktop/IMG_1234.jpg" },
  ],
} as const;

/** The contract in words, for a tool result or a prompt. */
export function materialContractText(path: MaterialPath = "harness"): string {
  return [
    `analysis.kind is one of ${MATERIAL_KINDS.join(", ")}.`,
    `proposals[].origin is one of ${MATERIAL_ORIGINS.join(", ")}; bloom is 1–5; file indexes files[]; page is the page or photo number.`,
    path === "harness"
      ? "files[] names each file you read: name, and path when you read it from disk (ZAM fingerprints the file and links the cards to it)."
      : "ZAM knows the files: proposals[].file is the 0-based number of the attachment in the order listed, and you return no files[].",
    `ZAM wraps this as version ${MATERIAL_PROPOSAL_SET_VERSION} of its proposal set and validates every field.`,
  ].join(" ");
}

// ── Built-in path: one request ───────────────────────────────────────────────

export interface MaterialInstructionsInput {
  /** The learner's interface locale ("de", "en-GB", …). */
  locale: string;
  /** Area paths already in the learner's library. */
  areas: string[];
  /** Subject codes of the cells for the learner's school type. */
  subjects: string[];
  /** The pages of a PDF the learner wants used ("2-4"), if any. */
  pages?: string;
}

/** The system instructions for the built-in path. */
export function buildMaterialInstructions(
  input: MaterialInstructionsInput,
): string {
  const example = {
    analysis: MATERIAL_CONTRACT_EXAMPLE.analysis,
    proposals: MATERIAL_CONTRACT_EXAMPLE.proposals,
  };
  const lines = [
    "You are ZAM's material reader. A learner attached photos or a PDF of their class notes or a handout. Propose learning cards from it for ZAM's review list.",
    "",
    "Rules:",
    ...materialCardRules("built-in").map((rule, i) => `${i + 1}. ${rule}`),
    "",
    `Subject codes: ${input.subjects.length > 0 ? input.subjects.join(", ") : "(none known — use the subject's German name in lower case)"}`,
    `Areas already in the learner's library: ${input.areas.length > 0 ? input.areas.join(", ") : "(none yet)"}`,
  ];
  if (input.pages?.trim()) {
    lines.push(
      `Use only these pages of the PDF: ${input.pages.trim()}. Ignore the others.`,
    );
  }
  lines.push(
    `The learner reads ZAM in ${languageName(input.locale)}; the cards still follow the material's language.`,
    "",
    "Answer with one JSON object and nothing else — no Markdown, no prose.",
    materialContractText("built-in"),
    `Example: ${JSON.stringify(example)}`,
  );
  return lines.join("\n");
}

export type MaterialFlavor = "chat-completions" | "anthropic-messages";

/** One attachment, already read and encoded by the caller. */
export interface MaterialAttachment {
  name: string;
  kind: "image" | "pdf";
  /** `image/jpeg`, `image/png`, `image/webp`, `image/gif` or `application/pdf`. */
  mime: string;
  base64: string;
}

/** The model row a request goes to, as far as the request needs to know it. */
export interface MaterialModelRow {
  model: string;
  /** The row's detected `file` capability: it reads PDFs itself. */
  readsPdf: boolean;
}

export interface MaterialRequest {
  /** Appended to the endpoint's base URL. */
  path: "chat/completions" | "messages";
  body: Record<string, unknown>;
}

/** The user turn's text: what is attached, in order. */
export function materialAttachmentList(
  attachments: Array<Pick<MaterialAttachment, "name" | "kind">>,
): string {
  return [
    "Attachments, in order:",
    ...attachments.map(
      (file, index) =>
        `${index}: ${file.name} (${file.kind === "pdf" ? "PDF" : "photo"})`,
    ),
  ].join("\n");
}

/**
 * The request body for one batch of attachments.
 *
 * Strict PDF gate (D1): a PDF part goes only to a row whose `file`
 * capability was detected. A gateway would otherwise transcribe the PDF on
 * its own side — the text step this feature rejects. On OpenRouter the native
 * engine is named explicitly as well, so a mismatch fails instead of falling
 * back to OCR.
 */
export function buildMaterialRequest(
  flavor: MaterialFlavor,
  model: MaterialModelRow,
  parts: {
    instructions: string;
    attachments: MaterialAttachment[];
    /** The endpoint is OpenRouter: JSON mode and the native PDF engine. */
    openRouter?: boolean;
    maxTokens?: number;
  },
): MaterialRequest {
  const hasPdf = parts.attachments.some((file) => file.kind === "pdf");
  if (hasPdf && !model.readsPdf) {
    throw new Error(
      `${model.model} does not read PDFs itself; a PDF is sent only to a model with the file capability.`,
    );
  }
  const text = materialAttachmentList(parts.attachments);
  const maxTokens = parts.maxTokens ?? MATERIAL_MAX_OUTPUT_TOKENS;

  if (flavor === "anthropic-messages") {
    return {
      path: "messages",
      body: {
        model: model.model,
        max_tokens: maxTokens,
        system: parts.instructions,
        messages: [
          {
            role: "user",
            content: [
              ...parts.attachments.map((file) =>
                file.kind === "pdf"
                  ? {
                      type: "document",
                      source: {
                        type: "base64",
                        media_type: "application/pdf",
                        data: file.base64,
                      },
                    }
                  : {
                      type: "image",
                      source: {
                        type: "base64",
                        media_type: file.mime,
                        data: file.base64,
                      },
                    },
              ),
              { type: "text", text },
            ],
          },
        ],
      },
    };
  }

  const body: Record<string, unknown> = {
    model: model.model,
    messages: [
      { role: "system", content: parts.instructions },
      {
        role: "user",
        content: [
          ...parts.attachments.map((file) =>
            file.kind === "pdf"
              ? {
                  type: "file",
                  file: {
                    filename: file.name,
                    file_data: `data:application/pdf;base64,${file.base64}`,
                  },
                }
              : {
                  type: "image_url",
                  image_url: { url: `data:${file.mime};base64,${file.base64}` },
                },
          ),
          { type: "text", text },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: maxTokens,
  };
  if (parts.openRouter) {
    body.response_format = { type: "json_object" };
    if (hasPdf) {
      body.plugins = [{ id: "file-parser", pdf: { engine: "native" } }];
    }
  }
  return { path: "chat/completions", body };
}

/**
 * Attachment numbers in batches whose base64 stays within `maxBytes`, in
 * order. A transport with a hard body limit (Mobile's native request) sends
 * one batch per request and merges the replies; an attachment over the
 * budget on its own forms its own batch, and the caller refuses it.
 */
export function batchByBudget(
  attachments: ReadonlyArray<{ base64: string }>,
  maxBytes: number,
): number[][] {
  const batches: number[][] = [];
  let current: number[] = [];
  let size = 0;
  attachments.forEach((file, index) => {
    const bytes = file.base64.length;
    if (current.length > 0 && size + bytes > maxBytes) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(index);
    size += bytes;
  });
  if (current.length > 0) batches.push(current);
  return batches;
}

/** The model's answer: analysis and proposals, not yet validated. */
export interface MaterialReply {
  analysis: unknown;
  proposals: unknown[];
}

/** Read the JSON object out of a reply; tolerates a fence or stray prose. */
export function parseMaterialReply(text: string): MaterialReply {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end <= start) {
      throw new Error("The model did not answer with a JSON object.");
    }
    try {
      parsed = JSON.parse(candidate.slice(start, end + 1));
    } catch {
      throw new Error("The model did not answer with a JSON object.");
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The model did not answer with a JSON object.");
  }
  const record = parsed as Record<string, unknown>;
  return {
    analysis: record.analysis,
    proposals: Array.isArray(record.proposals) ? record.proposals : [],
  };
}

/**
 * One proposal set from the replies of a split import (D3): the first
 * reply's analysis, every reply's proposals, each `file` mapped from the
 * batch's own numbering back to the import's.
 */
export function mergeMaterialReplies(
  replies: Array<{ reply: MaterialReply; fileIndexes: number[] }>,
): MaterialReply {
  const first = replies[0];
  if (!first) throw new Error("No reply to merge.");
  return {
    analysis: first.reply.analysis,
    proposals: replies.flatMap(({ reply, fileIndexes }) =>
      reply.proposals.map((proposal) => {
        if (!proposal || typeof proposal !== "object") return proposal;
        const record = proposal as Record<string, unknown>;
        // A missing index means the batch's first file, as in one request.
        const local = record.file ?? 0;
        // An index outside its own batch must not land on another file of
        // the import: -1 makes validation reject the answer instead.
        return {
          ...record,
          file:
            typeof local === "number" &&
            Number.isInteger(local) &&
            local >= 0 &&
            local < fileIndexes.length
              ? fileIndexes[local]
              : -1,
        };
      }),
    ),
  };
}
