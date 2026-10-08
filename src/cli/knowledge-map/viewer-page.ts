/**
 * `zam knowledge-map view` (ADR 2026-10-03): fills the built viewer template
 * (dist/ui/knowledge-map-viewer.html) with one repository's map and opens the
 * page in the default browser. The page needs no host, so it can also be
 * shared as a file.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadKnowledgeMap } from "./load.js";
import type { KnowledgeMap, MapIssue } from "./model.js";
import {
  MAP_DATA_ELEMENT_ID,
  MAP_DATA_SLOT,
  MAP_TITLE_SLOT,
  VIEWER_TEMPLATE_FILE,
} from "./viewer-slots.js";

/**
 * The built viewer template, looked up from this module's folder upwards:
 * `dist/cli/app.js` finds `dist/ui/`, a source checkout run through tsx finds
 * `<repo>/dist/ui/`, and the desktop app's bundled CLI finds its own copy.
 */
export function findViewerTemplate(
  startDir = dirname(fileURLToPath(import.meta.url)),
): string | null {
  let dir = startDir;
  for (let depth = 0; depth < 6; depth++) {
    for (const candidate of [
      join(dir, "ui", VIEWER_TEMPLATE_FILE),
      join(dir, "dist", "ui", VIEWER_TEMPLATE_FILE),
    ]) {
      if (existsSync(candidate)) return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** The template with the map filled in; throws when a slot is missing. */
export function renderViewerPage(template: string, map: KnowledgeMap): string {
  for (const slot of [MAP_DATA_SLOT, MAP_TITLE_SLOT]) {
    if (template.split(slot).length !== 2) {
      throw new Error(
        "The knowledge map viewer template is damaged: rebuild ZAM.",
      );
    }
  }
  // "<" escaped as < keeps the JSON valid and cannot close the script.
  const data = JSON.stringify(map).replace(/</g, "\\u003c");
  return template
    .replace(
      MAP_DATA_SLOT,
      () =>
        `<script type="application/json" id="${MAP_DATA_ELEMENT_ID}">${data}</script>`,
    )
    .replace(
      MAP_TITLE_SLOT,
      () => `<title>${escapeHtml(`${map.title} · Knowledge map`)}</title>`,
    );
}

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "knowledge-map"
  );
}

/** A stable page per map, so viewing again replaces the previous page. */
export function defaultViewerPath(map: KnowledgeMap): string {
  return join(tmpdir(), "zam-knowledge-map", `${slug(map.title)}.html`);
}

/** Hands a local file to the system's default handler; false when that fails. */
export function openInBrowser(path: string): boolean {
  const [command, args] =
    process.platform === "win32"
      ? ["explorer.exe", [path]]
      : process.platform === "darwin"
        ? ["open", [path]]
        : ["xdg-open", [path]];
  try {
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.on("error", () => undefined);
    child.unref();
    return true;
  } catch {
    return false;
  }
}

export interface ViewOptions {
  repo: string;
  out?: string;
  open: boolean;
  /** Tests pass the template; otherwise the built one is looked up. */
  template?: string;
  openPage?: (path: string) => boolean;
}

export type ViewResult =
  | {
      ok: true;
      path: string;
      opened: boolean;
      statements: number;
      relations: number;
      warnings: MapIssue[];
    }
  | { ok: false; error: string; issues: MapIssue[] };

export function viewKnowledgeMap(options: ViewOptions): ViewResult {
  const loaded = loadKnowledgeMap(options.repo);
  if (!loaded.found) {
    return {
      ok: false,
      error: `No knowledge map at ${loaded.path}. An agent builds one with zam_knowledge_map_guide, or see \`zam knowledge-map guide\`.`,
      issues: [],
    };
  }
  if (!loaded.map) {
    return {
      ok: false,
      error: `The knowledge map at ${loaded.path} has errors; \`zam knowledge-map validate --repo ${options.repo}\` lists them.`,
      issues: loaded.issues,
    };
  }
  let template = options.template;
  if (template === undefined) {
    const templatePath = findViewerTemplate();
    if (!templatePath) {
      return {
        ok: false,
        error:
          "The knowledge map viewer is missing from this ZAM installation. In a ZAM checkout, run `npm run build`.",
        issues: [],
      };
    }
    template = readFileSync(templatePath, "utf8");
  }
  const page = renderViewerPage(template, loaded.map);
  const path = resolve(options.out ?? defaultViewerPath(loaded.map));
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, page, "utf8");
  const opened = options.open && (options.openPage ?? openInBrowser)(path);
  return {
    ok: true,
    path,
    opened,
    statements: loaded.map.statements.length,
    relations: loaded.map.relations.length,
    warnings: loaded.issues.filter((issue) => issue.level === "warning"),
  };
}
