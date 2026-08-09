import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import type {
  Database,
  ImageOcclusionShape,
  TextImportAssetInput,
  TextImportCardInput,
  TextImportDocument,
  TextImportMediaReference,
  TextImportNotice,
} from "../../kernel/index.js";
import { openReadOnlySqliteDatabase } from "../../kernel/index.js";
import type { SafeAnkiMediaEntry } from "./safe-zip.js";
import { selectAnkiCollectionDatabase } from "./safe-zip.js";
import { sanitizeImportedText } from "./text-sanitizer.js";

interface AnkiModelField {
  name?: unknown;
}

interface AnkiTemplate {
  name?: unknown;
  ord?: unknown;
  qfmt?: unknown;
  afmt?: unknown;
}

interface AnkiModel {
  name?: unknown;
  type?: unknown;
  flds?: unknown;
  tmpls?: unknown;
}

interface AnkiDeck {
  name?: unknown;
}

interface AnkiCardRow {
  guid: string;
  mid: number | bigint | string;
  tags: string;
  flds: string;
  ord: number;
  did: number | bigint | string;
}

interface MediaLibraryEntry {
  asset: TextImportAssetInput | null;
  originalName: string;
}

interface SanitizedCardSide {
  text: string;
  media: TextImportMediaReference[];
  warnings: TextImportNotice[];
}

const REQUIRED_COLUMNS: Record<string, string[]> = {
  col: ["models", "decks"],
  notes: ["id", "guid", "mid", "tags", "flds"],
  cards: ["id", "nid", "did", "ord"],
};
const MAX_APKG_CARDS = 50_000;
const MAX_IMAGE_DIMENSION = 16_384;
const MAX_IMAGE_PIXELS = 40_000_000;

async function validateCollection(db: Database): Promise<void> {
  for (const [table, required] of Object.entries(REQUIRED_COLUMNS)) {
    const columns = (await db.pragma(`table_info(${table})`)) as Array<{
      name: string;
    }>;
    const names = new Set(columns.map((column) => column.name));
    const missing = required.filter((column) => !names.has(column));
    if (missing.length > 0) {
      throw new Error(
        `Unsupported Anki collection schema: ${table} is missing ${missing.join(", ")}`,
      );
    }
  }

  const integrity = (await db.pragma("integrity_check")) as Array<
    Record<string, unknown>
  >;
  const values = integrity.flatMap((row) => Object.values(row));
  if (values.length === 0 || values.some((value) => value !== "ok")) {
    throw new Error("Anki collection database failed SQLite integrity checks");
  }
}

function parseRecord<T>(value: unknown, label: string): Record<string, T> {
  if (typeof value !== "string") {
    throw new Error(`Anki collection ${label} metadata is not text JSON`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`Anki collection ${label} metadata is invalid JSON`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Anki collection ${label} metadata is not an object`);
  }
  return parsed as Record<string, T>;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numericValue(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return Number.NaN;
}

function renderSections(template: string, fields: Map<string, string>): string {
  let rendered = template;
  const section = /{{\s*([#^])\s*([^{}]+?)\s*}}([\s\S]*?){{\s*\/\s*\2\s*}}/g;
  for (let pass = 0; pass < 20 && section.test(rendered); pass++) {
    section.lastIndex = 0;
    rendered = rendered.replace(
      section,
      (_match, operator: string, name: string, body: string) => {
        const present = Boolean(fields.get(name.trim())?.trim());
        return operator === "#" ? (present ? body : "") : present ? "" : body;
      },
    );
  }
  section.lastIndex = 0;
  return rendered;
}

function renderTemplate(
  template: string,
  fields: Map<string, string>,
): { html: string; unsupportedField: string | null } {
  let unsupportedField: string | null = null;
  let rendered = renderSections(template, fields);
  rendered = rendered.replace(/{{\s*!([\s\S]*?)}}/g, "");
  rendered = rendered.replace(/{{\s*([^{}]+?)\s*}}/g, (_match, raw: string) => {
    const name = raw.trim();
    if (name.includes(":")) {
      unsupportedField = name;
      return "";
    }
    if (!fields.has(name)) {
      unsupportedField = name;
      return "";
    }
    return fields.get(name) ?? "";
  });
  return { html: rendered, unsupportedField };
}

function clozeParts(body: string): { content: string; hint: string | null } {
  const divider = body.indexOf("::");
  return divider === -1
    ? { content: body, hint: null }
    : { content: body.slice(0, divider), hint: body.slice(divider + 2) };
}

function renderClozeValue(
  value: string,
  active: number,
  answer: boolean,
): { html: string; activeFound: boolean } {
  let activeFound = false;
  const html = value.replace(
    /{{c(\d+)::([\s\S]*?)}}/gi,
    (_match, ordinalText: string, body: string) => {
      const ordinal = Number(ordinalText);
      const parts = clozeParts(body);
      if (ordinal === active) {
        activeFound = true;
        if (!answer) return parts.hint?.trim() ? `[${parts.hint}]` : "[…]";
      }
      return parts.content;
    },
  );
  return { html, activeFound };
}

function renderClozeTemplate(
  template: string,
  fields: Map<string, string>,
  active: number,
  answer: boolean,
): { html: string; activeFound: boolean; unsupportedField: string | null } {
  let activeFound = false;
  let unsupportedField: string | null = null;
  let rendered = renderSections(template, fields).replace(
    /{{\s*!([\s\S]*?)}}/g,
    "",
  );
  rendered = rendered.replace(/{{\s*([^{}]+?)\s*}}/g, (_match, raw: string) => {
    const expression = raw.trim();
    const [modifier, ...fieldParts] = expression.split(":");
    if (modifier === "cloze" && fieldParts.length === 1) {
      const value = fields.get(fieldParts[0]);
      if (value === undefined) {
        unsupportedField = expression;
        return "";
      }
      const cloze = renderClozeValue(value, active, answer);
      activeFound ||= cloze.activeFound;
      return cloze.html;
    }
    if (expression.includes(":")) {
      unsupportedField = expression;
      return "";
    }
    if (!fields.has(expression)) {
      unsupportedField = expression;
      return "";
    }
    return fields.get(expression) ?? "";
  });
  return { html: rendered, activeFound, unsupportedField };
}

function metadataField(
  fields: Map<string, string>,
  ...names: string[]
): string | null {
  const folded = new Map(
    [...fields].map(([name, value]) => [name.trim().toLowerCase(), value]),
  );
  for (const name of names) {
    const sanitized = sanitizeImportedText(folded.get(name) ?? "").text;
    if (sanitized) return sanitized;
  }
  return null;
}

function fieldValue(fields: Map<string, string>, ...names: string[]): string {
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  for (const [name, value] of fields) {
    if (wanted.has(name.trim().toLowerCase())) return value;
  }
  return "";
}

function attachContext(
  notices: TextImportNotice[],
  externalId: string,
  deckPath: string,
): TextImportNotice[] {
  return notices.map((notice) => ({ ...notice, externalId, deckPath }));
}

function hasPrefix(
  data: Uint8Array,
  offset: number,
  values: number[],
): boolean {
  return values.every((value, index) => data[offset + index] === value);
}

function safeImageDimensions(width: number, height: number): boolean {
  return (
    Number.isSafeInteger(width) &&
    Number.isSafeInteger(height) &&
    width > 0 &&
    height > 0 &&
    width <= MAX_IMAGE_DIMENSION &&
    height <= MAX_IMAGE_DIMENSION &&
    width * height <= MAX_IMAGE_PIXELS
  );
}

function u16be(data: Uint8Array, offset: number): number {
  return ((data[offset] ?? 0) << 8) | (data[offset + 1] ?? 0);
}

function u24le(data: Uint8Array, offset: number): number {
  return (
    (data[offset] ?? 0) |
    ((data[offset + 1] ?? 0) << 8) |
    ((data[offset + 2] ?? 0) << 16)
  );
}

function jpegDimensions(data: Uint8Array): [number, number] | null {
  let offset = 2;
  while (offset + 9 < data.byteLength) {
    if (data[offset] !== 0xff) return null;
    const marker = data[offset + 1] ?? 0;
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = u16be(data, offset);
    if (length < 2 || offset + length > data.byteLength) return null;
    if (
      [
        0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
        0xcf,
      ].includes(marker)
    ) {
      return [u16be(data, offset + 5), u16be(data, offset + 3)];
    }
    offset += length;
  }
  return null;
}

function mediaType(
  name: string,
  data: Uint8Array,
): Pick<TextImportAssetInput, "mimeType" | "kind"> | null {
  if (hasPrefix(data, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    if (data.byteLength < 24) return null;
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    if (!safeImageDimensions(view.getUint32(16), view.getUint32(20))) {
      return null;
    }
    return { mimeType: "image/png", kind: "image" };
  }
  if (hasPrefix(data, 0, [0xff, 0xd8, 0xff])) {
    const dimensions = jpegDimensions(data);
    if (!dimensions || !safeImageDimensions(...dimensions)) return null;
    return { mimeType: "image/jpeg", kind: "image" };
  }
  if (
    hasPrefix(data, 0, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    hasPrefix(data, 0, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    if (
      !safeImageDimensions(
        (data[6] ?? 0) | ((data[7] ?? 0) << 8),
        (data[8] ?? 0) | ((data[9] ?? 0) << 8),
      )
    ) {
      return null;
    }
    return { mimeType: "image/gif", kind: "image" };
  }
  if (
    hasPrefix(data, 0, [0x52, 0x49, 0x46, 0x46]) &&
    hasPrefix(data, 8, [0x57, 0x45, 0x42, 0x50])
  ) {
    let dimensions: [number, number] | null = null;
    if (
      hasPrefix(data, 12, [0x56, 0x50, 0x38, 0x58]) &&
      data.byteLength >= 30
    ) {
      dimensions = [u24le(data, 24) + 1, u24le(data, 27) + 1];
    } else if (
      hasPrefix(data, 12, [0x56, 0x50, 0x38, 0x20]) &&
      hasPrefix(data, 23, [0x9d, 0x01, 0x2a]) &&
      data.byteLength >= 30
    ) {
      dimensions = [
        ((data[26] ?? 0) | ((data[27] ?? 0) << 8)) & 0x3fff,
        ((data[28] ?? 0) | ((data[29] ?? 0) << 8)) & 0x3fff,
      ];
    }
    if (!dimensions || !safeImageDimensions(...dimensions)) return null;
    return { mimeType: "image/webp", kind: "image" };
  }
  if (
    hasPrefix(data, 0, [0x52, 0x49, 0x46, 0x46]) &&
    hasPrefix(data, 8, [0x57, 0x41, 0x56, 0x45])
  ) {
    return { mimeType: "audio/wav", kind: "audio" };
  }
  if (hasPrefix(data, 0, [0x4f, 0x67, 0x67, 0x53])) {
    return { mimeType: "audio/ogg", kind: "audio" };
  }
  if (
    hasPrefix(data, 0, [0x49, 0x44, 0x33]) ||
    (data[0] === 0xff && ((data[1] ?? 0) & 0xe0) === 0xe0)
  ) {
    return { mimeType: "audio/mpeg", kind: "audio" };
  }
  if (hasPrefix(data, 4, [0x66, 0x74, 0x79, 0x70])) {
    return { mimeType: "audio/mp4", kind: "audio" };
  }
  void name;
  return null;
}

function buildMediaLibrary(
  entries: SafeAnkiMediaEntry[],
): Map<string, MediaLibraryEntry> {
  const library = new Map<string, MediaLibraryEntry>();
  for (const entry of entries) {
    const type = mediaType(entry.originalName, entry.data);
    library.set(entry.originalName, {
      originalName: entry.originalName,
      asset: type
        ? {
            name: entry.originalName,
            mimeType: type.mimeType,
            kind: type.kind,
            data: entry.data,
          }
        : null,
    });
  }
  return library;
}

function attribute(tag: string, name: string): string | null {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  if (!match) return null;
  return (match[1] ?? match[2] ?? match[3] ?? "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function safeMediaName(value: string): string | null {
  let name = value.trim().replace(/\\/g, "/");
  try {
    name = decodeURIComponent(name);
  } catch {
    // Keep the literal filename; malformed URL escapes are not executable.
  }
  if (
    !name ||
    name.startsWith("/") ||
    /^[a-z]+:/i.test(name) ||
    name.split("/").some((part) => part === "..")
  ) {
    return null;
  }
  return name;
}

function collectMedia(
  html: string,
  side: "question" | "answer",
  library: Map<string, MediaLibraryEntry>,
): { media: TextImportMediaReference[]; warnings: TextImportNotice[] } {
  const media: TextImportMediaReference[] = [];
  const warnings: TextImportNotice[] = [];
  const seen = new Set<string>();
  const add = (rawName: string, altText: string | null): void => {
    const name = safeMediaName(rawName);
    if (!name) {
      warnings.push({
        code: "media-reference-blocked",
        message: "A remote or unsafe media reference was removed.",
      });
      return;
    }
    const entry = library.get(name);
    if (!entry) {
      warnings.push({
        code: "media-missing",
        message: `Referenced media is missing from the APKG: ${name}`,
      });
      return;
    }
    if (!entry.asset) {
      warnings.push({
        code: "media-format-unsupported",
        message: `Media uses an unsupported or unverified format: ${name}`,
      });
      return;
    }
    const key = `${side}:${name}`;
    if (seen.has(key)) return;
    seen.add(key);
    media.push({
      assetName: name,
      side,
      kind: entry.asset.kind,
      altText,
    });
  };

  for (const match of html.matchAll(/<\s*img\b[^>]*>/gi)) {
    const src = attribute(match[0], "src");
    if (src) add(src, attribute(match[0], "alt"));
  }
  for (const match of html.matchAll(/\[sound:([^\]]+)]/gi)) {
    add(match[1], null);
  }
  return { media, warnings };
}

function sanitizeCardSide(
  html: string,
  side: "question" | "answer",
  library: Map<string, MediaLibraryEntry>,
): SanitizedCardSide {
  const collected = collectMedia(html, side, library);
  // Media is rendered separately. Its alt text remains accessibility metadata
  // and must not accidentally reveal an image card's answer as prompt text.
  const sanitized = sanitizeImportedText(html);
  const textOnly = sanitizeImportedText(
    html.replace(/<\s*img\b[^>]*>/gi, " ").replace(/\[sound:[^\]]+]/gi, " "),
  );
  let text = textOnly.text;
  if (!text && collected.media.length > 0) {
    const audioOnly = collected.media.every((item) => item.kind === "audio");
    text =
      side === "question"
        ? audioOnly
          ? "Listen and recall the answer."
          : "Identify the item shown."
        : "Compare your answer with the revealed media.";
  }
  return {
    text,
    media: collected.media,
    warnings: [
      ...sanitized.warnings.filter(
        (notice) => notice.code !== "media-unsupported",
      ),
      ...collected.warnings,
    ],
  };
}

function commonCardFields(
  row: AnkiCardRow,
  fields: Map<string, string>,
  externalId: string,
  ordinal: number,
  deckPath: string,
): Omit<TextImportCardInput, "question" | "answer"> {
  return {
    externalId,
    noteGuid: row.guid,
    cardOrdinal: ordinal,
    deckPath,
    tags: stringValue(row.tags).trim().split(/\s+/).filter(Boolean),
    source: metadataField(fields, "source", "source url", "url"),
    author: metadataField(fields, "author", "creator"),
    license: metadataField(
      fields,
      "license",
      "licence",
      "copyright",
      "attribution",
    ),
  };
}

function parseOcclusionShapes(
  value: string,
  active: number,
): { shapes: ImageOcclusionShape[]; unsupported: boolean } {
  const shapes: ImageOcclusionShape[] = [];
  let unsupported = false;
  for (const match of value.matchAll(/{{c(\d+)::([\s\S]*?)}}/gi)) {
    if (Number(match[1]) !== active) continue;
    const body = clozeParts(match[2]).content;
    if (!body.startsWith("image-occlusion:")) continue;
    const parts = body.split(":");
    const shape = parts[1];
    if (shape !== "rect" && shape !== "ellipse") {
      unsupported = true;
      continue;
    }
    const values = new Map<string, number>();
    for (const part of parts.slice(2)) {
      const divider = part.indexOf("=");
      if (divider === -1) continue;
      values.set(part.slice(0, divider), Number(part.slice(divider + 1)));
    }
    const left = values.get("left");
    const top = values.get("top");
    const width = values.get("width");
    const height = values.get("height");
    if (
      [left, top, width, height].some(
        (coordinate) =>
          coordinate === undefined ||
          !Number.isFinite(coordinate) ||
          coordinate < 0 ||
          coordinate > 1,
      )
    ) {
      unsupported = true;
      continue;
    }
    shapes.push({
      shape,
      left: left as number,
      top: top as number,
      width: width as number,
      height: height as number,
    });
  }
  return { shapes, unsupported };
}

function parseImageOcclusionCard(
  row: AnkiCardRow,
  fields: Map<string, string>,
  externalId: string,
  ordinal: number,
  deckPath: string,
  library: Map<string, MediaLibraryEntry>,
): { card?: TextImportCardInput; notice?: TextImportNotice } {
  const image = fieldValue(fields, "image");
  const occlusion = fieldValue(fields, "occlusion");
  if (!image || !/image-occlusion:/i.test(occlusion)) return {};

  const active = ordinal + 1;
  const geometry = parseOcclusionShapes(occlusion, active);
  const imageSide = sanitizeCardSide(image, "question", library);
  const imageMedia = imageSide.media.find((item) => item.kind === "image");
  if (!imageMedia || geometry.shapes.length === 0) {
    return {
      notice: {
        code: "image-occlusion-unsupported",
        message:
          "Image occlusion needs a supported packaged image and rectangle or ellipse geometry.",
        externalId,
        deckPath,
      },
    };
  }

  const header = sanitizeImportedText(fieldValue(fields, "header")).text;
  const backExtra = sanitizeImportedText(
    fieldValue(fields, "back extra", "backextra", "comments"),
  ).text;
  const question = header
    ? `${header}\nName the hidden part.`
    : "Name the hidden part.";
  const answer = backExtra
    ? `Compare your answer with the revealed image.\n${backExtra}`
    : "Compare your answer with the revealed image.";
  const warnings = [...imageSide.warnings];
  if (geometry.unsupported) {
    warnings.push({
      code: "image-occlusion-shape-omitted",
      message: "An unsupported image-occlusion shape was omitted.",
    });
  }
  return {
    card: {
      ...commonCardFields(row, fields, externalId, ordinal, deckPath),
      question,
      answer,
      title: header || question,
      media: [
        { ...imageMedia, side: "question", occlusions: geometry.shapes },
        { ...imageMedia, side: "answer", occlusions: [] },
      ],
      warnings: attachContext(warnings, externalId, deckPath),
    },
  };
}

function parseClozeCard(
  row: AnkiCardRow,
  template: AnkiTemplate,
  fields: Map<string, string>,
  externalId: string,
  ordinal: number,
  deckPath: string,
  library: Map<string, MediaLibraryEntry>,
): { card?: TextImportCardInput; notice?: TextImportNotice } {
  const active = ordinal + 1;
  const front = renderClozeTemplate(
    stringValue(template.qfmt),
    fields,
    active,
    false,
  );
  const back = renderClozeTemplate(
    stringValue(template.afmt),
    fields,
    active,
    true,
  );
  const unsupportedField = front.unsupportedField ?? back.unsupportedField;
  if (unsupportedField) {
    return {
      notice: {
        code: "template-field-unsupported",
        message: `Anki template expression {{${unsupportedField}}} is not supported by the safe Cloze renderer.`,
        externalId,
        deckPath,
      },
    };
  }
  if (!front.activeFound && !back.activeFound) {
    return {
      notice: {
        code: "cloze-ordinal-missing",
        message: `Cloze card ${active} has no matching deletion in its note.`,
        externalId,
        deckPath,
      },
    };
  }

  const question = sanitizeCardSide(front.html, "question", library);
  const answer = sanitizeCardSide(back.html, "answer", library);
  if (!question.text || !answer.text) {
    return {
      notice: {
        code: "empty-after-sanitizing",
        message: "Cloze card has no safe question or answer after sanitizing.",
        externalId,
        deckPath,
      },
    };
  }
  return {
    card: {
      ...commonCardFields(row, fields, externalId, ordinal, deckPath),
      question: question.text,
      answer: answer.text,
      title: question.text,
      media: [...question.media, ...answer.media],
      warnings: attachContext(
        [...question.warnings, ...answer.warnings],
        externalId,
        deckPath,
      ),
    },
  };
}

async function parseCollection(
  db: Database,
  sourceName: string,
  packagedMedia: SafeAnkiMediaEntry[],
): Promise<TextImportDocument> {
  await validateCollection(db);
  const count = (await db.prepare("SELECT COUNT(*) AS n FROM cards").get()) as {
    n: number | bigint;
  };
  if (Number(count.n) > MAX_APKG_CARDS) {
    throw new Error(`APKG contains more than ${MAX_APKG_CARDS} cards`);
  }

  const collection = (await db
    .prepare("SELECT models, decks FROM col LIMIT 1")
    .get()) as { models: unknown; decks: unknown } | undefined;
  if (!collection) throw new Error("Anki collection has no col metadata row");
  const models = parseRecord<AnkiModel>(collection.models, "model");
  const decks = parseRecord<AnkiDeck>(collection.decks, "deck");
  const rows = (await db
    .prepare(
      `SELECT n.guid, n.mid, n.tags, n.flds, c.ord, c.did
         FROM cards c
         JOIN notes n ON n.id = c.nid
        ORDER BY n.guid, c.ord, c.id`,
    )
    .all()) as AnkiCardRow[];

  const mediaLibrary = buildMediaLibrary(packagedMedia);
  const cards: TextImportCardInput[] = [];
  const unsupported: TextImportNotice[] = [];
  for (const row of rows) {
    const ordinal = numericValue(row.ord);
    const externalId = `anki:${row.guid}:${ordinal}`;
    const deck = decks[String(row.did)];
    const deckPath = stringValue(deck?.name) || "Default";
    const model = models[String(row.mid)];
    if (!model) {
      unsupported.push({
        code: "missing-note-type",
        message: "Anki card references a missing note type.",
        externalId,
        deckPath,
      });
      continue;
    }

    const modelFields = Array.isArray(model.flds)
      ? (model.flds as AnkiModelField[])
      : [];
    const templates = Array.isArray(model.tmpls)
      ? (model.tmpls as AnkiTemplate[])
      : [];
    const isCloze = numericValue(model.type) === 1;
    const template = isCloze
      ? templates[0]
      : (templates.find(
          (candidate) => numericValue(candidate.ord) === ordinal,
        ) ?? templates[ordinal]);
    if (!template) {
      unsupported.push({
        code: "missing-card-template",
        message: "Anki card references a missing card template.",
        externalId,
        deckPath,
      });
      continue;
    }

    const values = stringValue(row.flds).split("\u001f");
    const fields = new Map<string, string>();
    modelFields.forEach((field, index) => {
      const name = stringValue(field.name);
      if (name) fields.set(name, values[index] ?? "");
    });
    fields.set("FrontSide", "");
    fields.set("Tags", stringValue(row.tags).trim());
    fields.set("Deck", deckPath);
    fields.set("Card", stringValue(template.name));
    fields.set("Type", stringValue(model.name));

    if (isCloze) {
      const occlusion = parseImageOcclusionCard(
        row,
        fields,
        externalId,
        ordinal,
        deckPath,
        mediaLibrary,
      );
      if (occlusion.card) {
        cards.push(occlusion.card);
        continue;
      }
      if (occlusion.notice) {
        unsupported.push(occlusion.notice);
        continue;
      }
      const cloze = parseClozeCard(
        row,
        template,
        fields,
        externalId,
        ordinal,
        deckPath,
        mediaLibrary,
      );
      if (cloze.card) cards.push(cloze.card);
      else if (cloze.notice) unsupported.push(cloze.notice);
      continue;
    }

    const front = renderTemplate(stringValue(template.qfmt), fields);
    const back = renderTemplate(stringValue(template.afmt), fields);
    const unsupportedField = front.unsupportedField ?? back.unsupportedField;
    if (unsupportedField) {
      unsupported.push({
        code: "template-field-unsupported",
        message: `Anki template expression {{${unsupportedField}}} is not supported by the safe renderer.`,
        externalId,
        deckPath,
      });
      continue;
    }
    if (/{{c\d+::/i.test(front.html) || /{{c\d+::/i.test(back.html)) {
      unsupported.push({
        code: "cloze-note-type-required",
        message: "Cloze syntax appears in a non-Cloze Anki note type.",
        externalId,
        deckPath,
      });
      continue;
    }

    const question = sanitizeCardSide(front.html, "question", mediaLibrary);
    const answer = sanitizeCardSide(back.html, "answer", mediaLibrary);
    if (!question.text || !answer.text) {
      unsupported.push({
        code: "empty-after-sanitizing",
        message:
          "Card has no safe question or answer after sanitizing unsupported content.",
        externalId,
        deckPath,
      });
      continue;
    }

    cards.push({
      ...commonCardFields(row, fields, externalId, ordinal, deckPath),
      question: question.text,
      answer: answer.text,
      title: question.text,
      media: [...question.media, ...answer.media],
      warnings: attachContext(
        [...question.warnings, ...answer.warnings],
        externalId,
        deckPath,
      ),
    });
  }

  const usedMedia = new Set(
    cards.flatMap((card) => (card.media ?? []).map((item) => item.assetName)),
  );
  const assets = [...mediaLibrary.values()]
    .filter(
      (entry): entry is MediaLibraryEntry & { asset: TextImportAssetInput } =>
        Boolean(entry.asset) && usedMedia.has(entry.originalName),
    )
    .map((entry) => entry.asset);
  return {
    format: "apkg",
    sourceName,
    cards,
    assets,
    warnings: [],
    unsupported,
  };
}

export async function loadApkgDocument(
  filePath: string,
): Promise<TextImportDocument> {
  const info = await stat(filePath);
  if (!info.isFile()) throw new Error("APKG import path is not a regular file");
  const archive = await readFile(filePath);
  const selection = selectAnkiCollectionDatabase(archive);
  const tempDirectory = await mkdtemp(join(tmpdir(), "zam-apkg-"));
  const databasePath = join(tempDirectory, selection.name);
  try {
    await writeFile(databasePath, selection.data, { flag: "wx" });
    const db = await openReadOnlySqliteDatabase(databasePath);
    try {
      return await parseCollection(db, basename(filePath), selection.media);
    } finally {
      await db.close();
    }
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}
