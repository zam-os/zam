import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import type {
  Database,
  TextImportCardInput,
  TextImportDocument,
  TextImportNotice,
} from "../../kernel/index.js";
import { openReadOnlySqliteDatabase } from "../../kernel/index.js";
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

const REQUIRED_COLUMNS: Record<string, string[]> = {
  col: ["models", "decks"],
  notes: ["id", "guid", "mid", "tags", "flds"],
  cards: ["id", "nid", "did", "ord"],
};
const MAX_APKG_CARDS = 50_000;

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

function attachContext(
  notices: TextImportNotice[],
  externalId: string,
  deckPath: string,
): TextImportNotice[] {
  return notices.map((notice) => ({ ...notice, externalId, deckPath }));
}

async function parseCollection(
  db: Database,
  sourceName: string,
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
    if (numericValue(model.type) === 1) {
      unsupported.push({
        code: "cloze-unsupported",
        message: "Cloze note types are not supported by the text importer yet.",
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
    const template =
      templates.find((candidate) => numericValue(candidate.ord) === ordinal) ??
      templates[ordinal];
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

    const front = renderTemplate(stringValue(template.qfmt), fields);
    const back = renderTemplate(stringValue(template.afmt), fields);
    const unsupportedField = front.unsupportedField ?? back.unsupportedField;
    if (unsupportedField) {
      unsupported.push({
        code: "template-field-unsupported",
        message: `Anki template expression {{${unsupportedField}}} is not supported by the safe text renderer.`,
        externalId,
        deckPath,
      });
      continue;
    }

    const question = sanitizeImportedText(front.html);
    const answer = sanitizeImportedText(back.html);
    if (/{{c\d+::/i.test(front.html) || /{{c\d+::/i.test(back.html)) {
      unsupported.push({
        code: "cloze-unsupported",
        message: "Cloze syntax is not supported by the text importer yet.",
        externalId,
        deckPath,
      });
      continue;
    }
    if (!question.text || !answer.text) {
      unsupported.push({
        code: "empty-after-sanitizing",
        message:
          "Card has no text question or answer after sanitizing unsupported content.",
        externalId,
        deckPath,
      });
      continue;
    }

    cards.push({
      externalId,
      noteGuid: row.guid,
      cardOrdinal: ordinal,
      question: question.text,
      answer: answer.text,
      title: question.text,
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
      warnings: attachContext(
        [...question.warnings, ...answer.warnings],
        externalId,
        deckPath,
      ),
    });
  }

  return {
    format: "apkg",
    sourceName,
    cards,
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
      return await parseCollection(db, basename(filePath));
    } finally {
      await db.close();
    }
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}
