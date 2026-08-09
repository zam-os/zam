import { extname } from "node:path";
import type { TextImportDocument } from "../../kernel/index.js";
import { loadApkgDocument } from "./apkg.js";
import { loadDelimitedDocument } from "./delimited.js";

/** Parse one supported local learning-content file without network or AI. */
export async function readTextImportFile(
  filePath: string,
): Promise<TextImportDocument> {
  const extension = extname(filePath).toLowerCase();
  if (extension === ".apkg") return loadApkgDocument(filePath);
  if (extension === ".csv" || extension === ".tsv") {
    return loadDelimitedDocument(filePath);
  }
  throw new Error(
    "Unsupported import file. Choose an .apkg, .csv, or .tsv file.",
  );
}
