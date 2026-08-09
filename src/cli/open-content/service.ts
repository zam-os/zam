import type {
  Database,
  TextImportCommitOptions,
  TextImportDocument,
} from "../../kernel/index.js";
import { commitTextImport, previewTextImport } from "../../kernel/index.js";
import { readTextImportFile } from "../import/text-file.js";
import {
  getOpenContentCatalogItem,
  type OpenContentCatalogItem,
} from "./catalog.js";
import {
  downloadOpenContentArtifact,
  type OpenContentDownloadResult,
} from "./download.js";

export interface OpenContentServiceDependencies {
  downloadArtifact?: (
    item: OpenContentCatalogItem,
  ) => Promise<OpenContentDownloadResult>;
  readImportFile?: (path: string) => Promise<TextImportDocument>;
}

/** Attach the catalog's reviewed provenance to every imported card. */
export function applyOpenContentMetadata(
  document: TextImportDocument,
  item: OpenContentCatalogItem,
): TextImportDocument {
  const license = `${item.license.id} (${item.license.url})`;
  return {
    ...document,
    sourceName: item.artifact.fileName,
    cards: document.cards.map((card) => ({
      ...card,
      source: item.sourceUrl,
      author: item.author.name,
      license,
      tags: [
        ...new Set([
          ...(card.tags ?? []),
          "zam-open-content",
          `open-content:${item.id}`,
        ]),
      ],
    })),
  };
}

async function loadCatalogDocument(
  id: string,
  dependencies: OpenContentServiceDependencies,
): Promise<{
  item: OpenContentCatalogItem;
  download: OpenContentDownloadResult;
  document: TextImportDocument;
}> {
  const item = getOpenContentCatalogItem(id);
  const download = await (
    dependencies.downloadArtifact ?? downloadOpenContentArtifact
  )(item);
  const parsed = await (dependencies.readImportFile ?? readTextImportFile)(
    download.path,
  );
  if (
    parsed.cards.length !== item.artifact.expectedCards ||
    (parsed.unsupported?.length ?? 0) > 0
  ) {
    throw new Error(
      `${item.title} no longer matches its reviewed ${item.artifact.expectedCards}-card catalog entry`,
    );
  }
  return {
    item,
    download,
    document: applyOpenContentMetadata(parsed, item),
  };
}

export async function previewOpenContentImport(
  db: Database,
  userId: string,
  id: string,
  dependencies: OpenContentServiceDependencies = {},
) {
  const loaded = await loadCatalogDocument(id, dependencies);
  const preview = await previewTextImport(db, userId, loaded.document);
  return {
    item: loaded.item,
    artifact: {
      cached: loaded.download.cached,
      sha256: loaded.download.sha256,
      byteSize: loaded.download.byteSize,
    },
    ...preview,
  };
}

export async function confirmOpenContentImport(
  db: Database,
  userId: string,
  id: string,
  planHash: string,
  dependencies: OpenContentServiceDependencies = {},
  options: TextImportCommitOptions = {},
) {
  const loaded = await loadCatalogDocument(id, dependencies);
  const result = await commitTextImport(
    db,
    userId,
    loaded.document,
    planHash,
    options,
  );
  return {
    item: loaded.item,
    artifact: {
      cached: loaded.download.cached,
      sha256: loaded.download.sha256,
      byteSize: loaded.download.byteSize,
    },
    ...result,
  };
}
