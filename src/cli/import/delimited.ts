import { readFile, stat } from "node:fs/promises";
import { basename, extname } from "node:path";
import type {
  TextImportCardInput,
  TextImportDocument,
  TextImportFormat,
  TextImportNotice,
} from "../../kernel/index.js";
import { computeContentHash } from "../../kernel/index.js";
import { sanitizeImportedText } from "./text-sanitizer.js";

const MAX_DELIMITED_FILE_BYTES = 25 * 1024 * 1024;
const MAX_ROWS = 50_001;
const MAX_COLUMNS = 64;

const QUESTION_HEADERS = ["question", "front", "prompt"];
const ANSWER_HEADERS = ["answer", "back", "concept"];

function headerKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function parseRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let afterQuote = false;

  const pushField = () => {
    row.push(field);
    field = "";
    afterQuote = false;
    if (row.length > MAX_COLUMNS) {
      throw new Error(`Delimited file has more than ${MAX_COLUMNS} columns`);
    }
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
    if (rows.length > MAX_ROWS) {
      throw new Error(`Delimited file has more than ${MAX_ROWS - 1} data rows`);
    }
  };

  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          quoted = false;
          afterQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (afterQuote && character !== delimiter && character !== "\n") {
      if (character === "\r" && text[index + 1] === "\n") continue;
      if (/\s/.test(character)) continue;
      throw new Error("Unexpected text after a quoted field");
    }
    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === delimiter) {
      pushField();
    } else if (character === "\n") {
      pushRow();
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (quoted) throw new Error("Delimited file ends inside a quoted field");
  if (field.length > 0 || row.length > 0 || afterQuote) pushRow();
  return rows;
}

function selectHeader(
  indexes: Map<string, number>,
  names: string[],
  label: string,
): number {
  const matches = names.filter((name) => indexes.has(name));
  if (matches.length !== 1) {
    throw new Error(
      matches.length === 0
        ? `Delimited file needs a ${label} column (${names.join(", ")})`
        : `Delimited file has multiple ${label} columns: ${matches.join(", ")}`,
    );
  }
  return indexes.get(matches[0]) as number;
}

function optionalColumn(
  indexes: Map<string, number>,
  ...names: string[]
): number | undefined {
  return names.map((name) => indexes.get(name)).find((value) => value != null);
}

function valueAt(row: string[], index: number | undefined): string {
  return index === undefined ? "" : (row[index] ?? "");
}

function noticesFor(
  notices: TextImportNotice[],
  externalId: string,
  deckPath: string,
): TextImportNotice[] {
  return notices.map((notice) => ({ ...notice, externalId, deckPath }));
}

export function parseDelimitedText(
  input: string,
  format: Extract<TextImportFormat, "csv" | "tsv">,
  sourceName: string,
): TextImportDocument {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const rows = parseRows(text, format === "csv" ? "," : "\t");
  if (rows.length === 0) throw new Error("Delimited file is empty");

  const headers = rows[0].map(headerKey);
  const indexes = new Map<string, number>();
  headers.forEach((header, index) => {
    if (!header) throw new Error(`Column ${index + 1} has an empty header`);
    if (indexes.has(header)) {
      throw new Error(`Delimited file has duplicate header: ${header}`);
    }
    indexes.set(header, index);
  });

  const questionIndex = selectHeader(indexes, QUESTION_HEADERS, "question");
  const answerIndex = selectHeader(indexes, ANSWER_HEADERS, "answer");
  const idIndex = optionalColumn(indexes, "id", "external_id");
  const deckIndex = optionalColumn(indexes, "deck", "deck_path", "domain");
  const tagsIndex = optionalColumn(indexes, "tags");
  const sourceIndex = optionalColumn(indexes, "source", "source_link");
  const authorIndex = optionalColumn(indexes, "author");
  const licenseIndex = optionalColumn(indexes, "license", "licence");
  const titleIndex = optionalColumn(indexes, "title");
  const stem = basename(sourceName, extname(sourceName));
  const defaultDeck = `Imported::${stem || "Cards"}`;
  const scope = computeContentHash(
    `${format}:${basename(sourceName).toLowerCase()}`,
  ).slice(0, 24);
  const warnings: TextImportNotice[] = [];
  const unsupported: TextImportNotice[] = [];
  const cards: TextImportCardInput[] = [];

  if (idIndex === undefined) {
    warnings.push({
      code: "positional-identity",
      message:
        "No id column was found. Re-import identity uses row positions, so reordering rows may look like content changes.",
    });
  }

  for (let index = 1; index < rows.length; index++) {
    const row = rows[index];
    const rowNumber = index + 1;
    if (row.every((value) => value.trim() === "")) continue;
    const rawId = valueAt(row, idIndex).trim();
    const identityPart = idIndex === undefined ? `row:${rowNumber}` : rawId;
    const externalId = `${format}:${scope}:${
      idIndex === undefined
        ? identityPart
        : computeContentHash(identityPart).slice(0, 32)
    }`;
    const rawDeck = sanitizeImportedText(valueAt(row, deckIndex)).text;
    const deckPath = rawDeck || defaultDeck;

    if (row.length !== headers.length) {
      unsupported.push({
        code: "column-count-mismatch",
        message: `Row ${rowNumber} has ${row.length} fields; expected ${headers.length}.`,
        externalId,
        deckPath,
      });
      continue;
    }
    if (idIndex !== undefined && !rawId) {
      unsupported.push({
        code: "missing-row-id",
        message: `Row ${rowNumber} has no stable id.`,
        externalId,
        deckPath,
      });
      continue;
    }

    const question = sanitizeImportedText(valueAt(row, questionIndex));
    const answer = sanitizeImportedText(valueAt(row, answerIndex));
    if (
      /{{c\d+::/i.test(valueAt(row, questionIndex)) ||
      /{{c\d+::/i.test(valueAt(row, answerIndex))
    ) {
      unsupported.push({
        code: "cloze-unsupported",
        message: `Row ${rowNumber} uses Cloze syntax, which is not supported by the text importer yet.`,
        externalId,
        deckPath,
      });
      continue;
    }
    if (!question.text || !answer.text) {
      unsupported.push({
        code: "empty-after-sanitizing",
        message: `Row ${rowNumber} has no text question or answer after sanitizing unsupported content.`,
        externalId,
        deckPath,
      });
      continue;
    }

    const cardWarnings = noticesFor(
      [...question.warnings, ...answer.warnings],
      externalId,
      deckPath,
    );
    cards.push({
      externalId,
      question: question.text,
      answer: answer.text,
      title: sanitizeImportedText(valueAt(row, titleIndex)).text || null,
      deckPath,
      tags: sanitizeImportedText(valueAt(row, tagsIndex))
        .text.split(/[,;\s]+/)
        .filter(Boolean),
      source: sanitizeImportedText(valueAt(row, sourceIndex)).text || null,
      author: sanitizeImportedText(valueAt(row, authorIndex)).text || null,
      license: sanitizeImportedText(valueAt(row, licenseIndex)).text || null,
      warnings: cardWarnings,
    });
  }

  return {
    format,
    sourceName: basename(sourceName),
    cards,
    warnings,
    unsupported,
  };
}

export async function loadDelimitedDocument(
  filePath: string,
): Promise<TextImportDocument> {
  const info = await stat(filePath);
  if (!info.isFile()) throw new Error("Import path is not a regular file");
  if (info.size > MAX_DELIMITED_FILE_BYTES) {
    throw new Error("Delimited import exceeds the 25 MiB size limit");
  }
  const format = extname(filePath).toLowerCase() === ".tsv" ? "tsv" : "csv";
  const bytes = await readFile(filePath);
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Delimited import must be valid UTF-8 text");
  }
  return parseDelimitedText(text, format, basename(filePath));
}
