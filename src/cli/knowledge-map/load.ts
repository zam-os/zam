/**
 * Reads a repository's knowledge map from disk and validates it, with every
 * source checked against the repository (ADR 2026-10-03, Decision 5).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type KnowledgeMap,
  type MapIssue,
  toKnowledgeMapDocument,
  validateKnowledgeMap,
} from "./model.js";

/** Where a repository keeps its map, relative to the repository root. */
export const KNOWLEDGE_MAP_RELATIVE_PATH = join(
  "docs",
  "knowledge-map",
  "map.json",
);

export interface LoadedKnowledgeMap {
  found: boolean;
  path: string;
  map: KnowledgeMap | null;
  issues: MapIssue[];
}

/** True when `path` names an existing file or folder inside `repoRoot`. */
export function repoSourceExists(repoRoot: string, path: string): boolean {
  const root = resolve(repoRoot);
  const target = resolve(root, path);
  if (target !== root && !target.startsWith(root + sep)) return false;
  return existsSync(target);
}

export function loadKnowledgeMap(repoRoot: string): LoadedKnowledgeMap {
  const path = join(resolve(repoRoot), KNOWLEDGE_MAP_RELATIVE_PATH);
  if (!existsSync(path)) {
    return { found: false, path, map: null, issues: [] };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    return {
      found: true,
      path,
      map: null,
      issues: [
        {
          level: "error",
          message: `The map is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }
  const { map, issues } = validateKnowledgeMap(parsed, {
    sourceExists: (source) => repoSourceExists(repoRoot, source),
  });
  return { found: true, path, map, issues };
}

export interface WrittenKnowledgeMap {
  ok: boolean;
  path: string;
  issues: MapIssue[];
  statements?: number;
  relations?: number;
}

/**
 * Validate a whole map against the repository and write it as
 * `docs/knowledge-map/map.json` — only when there is no error. The written
 * file always carries the schema link and the JSON-LD context, so an agent
 * never has to write either.
 */
export function writeKnowledgeMap(
  repoRoot: string,
  input: unknown,
): WrittenKnowledgeMap {
  const path = join(resolve(repoRoot), KNOWLEDGE_MAP_RELATIVE_PATH);
  const { map, issues } = validateKnowledgeMap(input, {
    sourceExists: (source) => repoSourceExists(repoRoot, source),
  });
  if (!map) return { ok: false, path, issues };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    `${JSON.stringify(toKnowledgeMapDocument(map), null, 2)}\n`,
    "utf8",
  );
  return {
    ok: true,
    path,
    issues,
    statements: map.statements.length,
    relations: map.relations.length,
  };
}

/** The folders behind an MCP client's `file:` roots, in the client's order. */
export function rootDirsFromUris(rootUris: string[]): string[] {
  const dirs: string[] = [];
  for (const uri of rootUris) {
    if (!uri?.startsWith("file:")) continue;
    try {
      dirs.push(fileURLToPath(uri));
    } catch {
      // malformed root URI: skip
    }
  }
  return dirs;
}

/**
 * The repository whose map to *read*: the first root that already has a map,
 * else the first file root, else `fallback`. Writing never uses this rule; it
 * takes an explicit repository or the first root, so it cannot overwrite the
 * map of another workspace folder.
 */
export function resolveRepoRootFromRoots(
  rootUris: string[],
  fallback: string,
): string {
  const dirs = rootDirsFromUris(rootUris);
  return (
    dirs.find((dir) => existsSync(join(dir, KNOWLEDGE_MAP_RELATIVE_PATH))) ??
    dirs[0] ??
    fallback
  );
}
