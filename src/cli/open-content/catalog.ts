/**
 * Curated, open-licensed learning-content catalog (ADR 2026-08-09).
 *
 * The catalog ships with the CLI. It is deliberately not populated from a
 * remote registry at runtime: every artifact is reviewed, pinned, licensed,
 * and integrity-checked before it can become learner-facing.
 */

export type OpenContentLevel = "introductory" | "intermediate" | "advanced";

export interface OpenContentLicense {
  /** SPDX-compatible identifier. */
  id: "CC-BY-4.0";
  name: string;
  url: string;
  /** Immutable upstream license evidence for this artifact revision. */
  sourceUrl: string;
}

export interface OpenContentArtifact {
  format: "apkg";
  fileName: string;
  downloadUrl: string;
  allowedDownloadHosts: string[];
  revision: string;
  sha256: string;
  byteSize: number;
  expectedCards: number;
}

export interface OpenContentCatalogItem {
  id: string;
  title: string;
  description: string;
  author: { name: string; url: string };
  attribution: string;
  license: OpenContentLicense;
  projectUrl: string;
  /** Immutable upstream page for the exact distributed artifact. */
  sourceUrl: string;
  languages: string[];
  subjects: string[];
  tags: string[];
  level: OpenContentLevel;
  artifact: OpenContentArtifact;
}

export interface OpenContentCatalogQuery {
  query?: string;
  language?: string;
  subject?: string;
}

export interface OpenContentCatalogListing {
  revision: number;
  items: OpenContentCatalogItem[];
  filters: { languages: string[]; subjects: string[] };
}

export const OPEN_CONTENT_CATALOG_REVISION = 1;

const SYSTEM_DESIGN_REVISION = "ae9bbd7b02d90b9866215de185217d33f39ab733";
const SYSTEM_DESIGN_REPOSITORY =
  "https://github.com/donnemartin/system-design-primer";
const SYSTEM_DESIGN_RAW = `https://raw.githubusercontent.com/donnemartin/system-design-primer/${SYSTEM_DESIGN_REVISION}/resources/flash_cards`;
const SYSTEM_DESIGN_SOURCE = `${SYSTEM_DESIGN_REPOSITORY}/blob/${SYSTEM_DESIGN_REVISION}/resources/flash_cards`;
const SYSTEM_DESIGN_LICENSE: OpenContentLicense = {
  id: "CC-BY-4.0",
  name: "Creative Commons Attribution 4.0 International",
  url: "https://creativecommons.org/licenses/by/4.0/",
  sourceUrl: `${SYSTEM_DESIGN_REPOSITORY}/blob/${SYSTEM_DESIGN_REVISION}/LICENSE.txt`,
};
const SYSTEM_DESIGN_AUTHOR = {
  name: "Donne Martin",
  url: "https://github.com/donnemartin",
};

function systemDesignItem(
  item: Omit<
    OpenContentCatalogItem,
    | "author"
    | "attribution"
    | "license"
    | "projectUrl"
    | "languages"
    | "artifact"
  > & {
    artifact: Omit<
      OpenContentArtifact,
      "format" | "allowedDownloadHosts" | "revision"
    >;
  },
): OpenContentCatalogItem {
  return {
    ...item,
    author: SYSTEM_DESIGN_AUTHOR,
    attribution:
      "System Design Primer by Donne Martin, licensed under CC BY 4.0.",
    license: SYSTEM_DESIGN_LICENSE,
    projectUrl: SYSTEM_DESIGN_REPOSITORY,
    languages: ["en"],
    artifact: {
      ...item.artifact,
      format: "apkg",
      allowedDownloadHosts: ["raw.githubusercontent.com"],
      revision: SYSTEM_DESIGN_REVISION,
    },
  };
}

export const OPEN_CONTENT_CATALOG: readonly OpenContentCatalogItem[] = [
  systemDesignItem({
    id: "system-design-primer-fundamentals",
    title: "System Design Fundamentals",
    description:
      "Core concepts for designing scalable systems and preparing for system-design interviews.",
    sourceUrl: `${SYSTEM_DESIGN_SOURCE}/System%20Design.apkg`,
    subjects: ["Computer Science", "Software Architecture"],
    tags: ["distributed systems", "scalability", "interview preparation"],
    level: "intermediate",
    artifact: {
      fileName: "System Design.apkg",
      downloadUrl: `${SYSTEM_DESIGN_RAW}/System%20Design.apkg`,
      sha256:
        "bb98767862cbd92f62c4f60f42d49d17d82b84a5f74d4301a2ea8940dc9badf8",
      byteSize: 46_227,
      expectedCards: 42,
    },
  }),
  systemDesignItem({
    id: "system-design-primer-exercises",
    title: "System Design Exercises",
    description:
      "Practice prompts for common large-scale system-design interview problems.",
    sourceUrl: `${SYSTEM_DESIGN_SOURCE}/System%20Design%20Exercises.apkg`,
    subjects: ["Computer Science", "Software Architecture"],
    tags: ["system design", "exercises", "interview preparation"],
    level: "intermediate",
    artifact: {
      fileName: "System Design Exercises.apkg",
      downloadUrl: `${SYSTEM_DESIGN_RAW}/System%20Design%20Exercises.apkg`,
      sha256:
        "1c5c1f34f2aa9d740d95499e18a323f7f918947120ac117c242c76f3b2364de0",
      byteSize: 64_943,
      expectedCards: 8,
    },
  }),
  systemDesignItem({
    id: "system-design-primer-object-oriented-exercises",
    title: "Object-Oriented Design Exercises",
    description:
      "Practice prompts for object-oriented design interviews and design trade-offs.",
    sourceUrl: `${SYSTEM_DESIGN_SOURCE}/OO%20Design.apkg`,
    subjects: ["Computer Science", "Software Design"],
    tags: ["object-oriented design", "exercises", "interview preparation"],
    level: "intermediate",
    artifact: {
      fileName: "OO Design.apkg",
      downloadUrl: `${SYSTEM_DESIGN_RAW}/OO%20Design.apkg`,
      sha256:
        "b3eefdd3169038660e07c2744b07d4690a0fcb8c21408d91bef447756f5c7cfc",
      byteSize: 18_501,
      expectedCards: 6,
    },
  }),
];

const COMPATIBLE_LICENSES = new Set<OpenContentLicense["id"]>(["CC-BY-4.0"]);
const MAX_ARTIFACT_BYTES = 200 * 1024 * 1024;

function requireText(value: string, field: string, itemId: string): void {
  if (!value.trim())
    throw new Error(`Open-content item ${itemId} needs ${field}`);
}

function requireHttps(value: string, field: string, itemId: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Open-content item ${itemId} has an invalid ${field}`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`Open-content item ${itemId} requires HTTPS for ${field}`);
  }
  return url;
}

/** Reject incomplete, unlicensed, mutable-looking, or unsafe catalog data. */
export function validateOpenContentCatalog(
  entries: readonly OpenContentCatalogItem[],
): void {
  const ids = new Set<string>();
  for (const item of entries) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) {
      throw new Error(`Open-content item has an invalid id: ${item.id}`);
    }
    if (ids.has(item.id)) {
      throw new Error(`Open-content catalog has duplicate id: ${item.id}`);
    }
    ids.add(item.id);
    requireText(item.title, "a title", item.id);
    requireText(item.description, "a description", item.id);
    requireText(item.author.name, "an author", item.id);
    requireText(item.attribution, "attribution", item.id);
    requireText(item.license.name, "a license name", item.id);
    if (!COMPATIBLE_LICENSES.has(item.license.id)) {
      throw new Error(
        `Open-content item ${item.id} has an incompatible license`,
      );
    }
    requireHttps(item.author.url, "author URL", item.id);
    requireHttps(item.license.url, "license URL", item.id);
    requireHttps(item.license.sourceUrl, "license evidence URL", item.id);
    requireHttps(item.projectUrl, "project URL", item.id);
    requireHttps(item.sourceUrl, "source URL", item.id);
    const downloadUrl = requireHttps(
      item.artifact.downloadUrl,
      "download URL",
      item.id,
    );
    if (
      item.artifact.allowedDownloadHosts.length === 0 ||
      !item.artifact.allowedDownloadHosts.includes(downloadUrl.hostname)
    ) {
      throw new Error(
        `Open-content item ${item.id} has no valid download host`,
      );
    }
    if (
      item.artifact.allowedDownloadHosts.some(
        (host) => !host || host !== host.toLowerCase() || host.includes("/"),
      )
    ) {
      throw new Error(
        `Open-content item ${item.id} has an invalid download host`,
      );
    }
    if (
      item.artifact.format !== "apkg" ||
      !/^[^/\\]+\.apkg$/i.test(item.artifact.fileName)
    ) {
      throw new Error(`Open-content item ${item.id} has an invalid artifact`);
    }
    if (!/^[a-f0-9]{40}$/.test(item.artifact.revision)) {
      throw new Error(`Open-content item ${item.id} needs a pinned revision`);
    }
    if (!/^[a-f0-9]{64}$/.test(item.artifact.sha256)) {
      throw new Error(`Open-content item ${item.id} has an invalid SHA-256`);
    }
    if (
      !Number.isSafeInteger(item.artifact.byteSize) ||
      item.artifact.byteSize <= 0 ||
      item.artifact.byteSize > MAX_ARTIFACT_BYTES
    ) {
      throw new Error(`Open-content item ${item.id} has an invalid byte size`);
    }
    if (
      !Number.isSafeInteger(item.artifact.expectedCards) ||
      item.artifact.expectedCards <= 0
    ) {
      throw new Error(
        `Open-content item ${item.id} needs an expected card count`,
      );
    }
    if (item.languages.length === 0 || item.subjects.length === 0) {
      throw new Error(`Open-content item ${item.id} needs discovery metadata`);
    }
  }
}

function normalized(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function matches(value: string, filter: string | undefined): boolean {
  return !filter || normalized(value) === normalized(filter);
}

export function getOpenContentCatalogItem(id: string): OpenContentCatalogItem {
  const item = OPEN_CONTENT_CATALOG.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Unknown open-content item: ${id}`);
  return item;
}

export function listOpenContentCatalog(
  query: OpenContentCatalogQuery = {},
): OpenContentCatalogListing {
  const needle = normalized(query.query ?? "");
  const items = OPEN_CONTENT_CATALOG.filter((item) => {
    if (
      query.language &&
      !item.languages.some((language) => matches(language, query.language))
    ) {
      return false;
    }
    if (
      query.subject &&
      !item.subjects.some((subject) => matches(subject, query.subject))
    ) {
      return false;
    }
    if (!needle) return true;
    return normalized(
      [
        item.title,
        item.description,
        item.author.name,
        item.attribution,
        ...item.languages,
        ...item.subjects,
        ...item.tags,
      ].join(" "),
    ).includes(needle);
  }).map((item) => structuredClone(item));

  return {
    revision: OPEN_CONTENT_CATALOG_REVISION,
    items,
    filters: {
      languages: [
        ...new Set(OPEN_CONTENT_CATALOG.flatMap((item) => item.languages)),
      ].sort(),
      subjects: [
        ...new Set(OPEN_CONTENT_CATALOG.flatMap((item) => item.subjects)),
      ].sort(),
    },
  };
}

validateOpenContentCatalog(OPEN_CONTENT_CATALOG);
