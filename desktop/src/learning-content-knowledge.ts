/**
 * What a Quelle shows once its directory is there (ADR 2026-10-10,
 * Decisions 6–8).
 *
 * The OKF list loads with the switcher, and the knowledge-map module loads
 * with it, lazily: no switch hides the map any more. The map takes the
 * page's full width and offers its views in place. Articles and citations
 * open in a reader dialog: reading is one thing at a time and needs no
 * column next to the map. A Markdown file is rendered, other files show as
 * text. A URL or a path outside the Quelle is refused, and the operating
 * system is not asked to open it. This module does not repair a workspace,
 * upsert an article, or write a knowledge map.
 *
 * Two ways in (Decision 11). The Desktop window reads a Quelle by path and
 * may show any cited file inside it. The Studio panel names a workspace by
 * id and reads only its OKF articles and its map; anything else is the
 * sentence that it opens in ZAM Desktop.
 */

import { citationTarget } from "../../src/cli/learning-content/citation.js";
import { runBridge } from "./bridge-transport.js";
import { t, tf } from "./i18n.js";
import { renderMarkdown, stripFrontmatter } from "./panel/okf-render.js";

interface SourceArticle {
  file: string;
  title: string;
}

interface CatalogResponse {
  okf: { found: false } | { found: true; articles: SourceArticle[] };
}

interface ReadResponse {
  opened: boolean;
  reason?: "outside" | "missing" | "desktop";
  kind?: "okf" | "text";
  path?: string;
  body?: string;
}

// A type query, not an import: the map module stays lazy (ADR 2026-10-03).
type SourceMapResponse = import("./knowledge-map/studio.js").SourceMapResponse;

/** One Quelle the page shows: a configured workspace, or a picked folder. */
export type SourceRef =
  | { kind: "workspace"; id: string; path: string }
  | { kind: "folder"; path: string };

/** The three reads a Quelle needs, by path or by workspace id. */
interface SourceAccess {
  catalog(): Promise<CatalogResponse>;
  read(target: string): Promise<ReadResponse>;
  map(): Promise<SourceMapResponse>;
}

function sourceAccess(source: SourceRef, byPath: boolean): SourceAccess {
  if (byPath || source.kind === "folder") {
    const repo = source.path;
    return {
      catalog: () => runBridge("learning-content-browse", ["--repo", repo]),
      read: (target) =>
        runBridge("learning-content-browse", [
          "--repo",
          repo,
          "--target",
          target,
        ]),
      map: () => runBridge("knowledge-map", ["--repo", repo]),
    };
  }
  const workspace = ["--workspace", source.id];
  return {
    catalog: () => runBridge("learning-content-workspace", workspace),
    read: (target) =>
      runBridge("learning-content-workspace", [
        ...workspace,
        "--target",
        target,
      ]),
    map: () => runBridge("learning-content-workspace", [...workspace, "--map"]),
  };
}

let generation = 0;
let studioLoaded = false;
let readerBound = false;
let readerReturnFocus: HTMLElement | null = null;

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function setHidden(id: string, hidden: boolean): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("hidden", hidden);
  if (el instanceof HTMLElement) el.hidden = hidden;
}

export function applySourceKnowledgeChrome(): void {
  const okf = document.getElementById("lbl-content-source-okf");
  if (okf) okf.textContent = t("lbl_content_source_okf");
  const reader = document.getElementById("lbl-content-source-reader");
  if (reader) reader.textContent = t("lbl_content_source_reader");
  const close = document.getElementById("btn-content-source-reader-close");
  if (close) close.textContent = t("content_source_reader_close");
}

export function clearSourceKnowledge(): void {
  generation += 1;
  setHidden("content-sources-body", true);
  document.getElementById("content-sources-map")?.replaceChildren();
  document.getElementById("content-sources-okf-list")?.replaceChildren();
  const note = document.getElementById("content-sources-okf-note");
  if (note) note.textContent = "";
  closeSourceReader();
  if (!studioLoaded) return;
  void import("./knowledge-map/studio.js").then((mod) => {
    mod.clearSourceKnowledgeMap();
  });
}

/**
 * Show one Quelle. `byPath` is true in the Desktop window only; the Studio
 * panel passes false and must give a workspace (Decision 11).
 */
export function showSourceKnowledge(
  source: SourceRef,
  skillSource: boolean,
  byPath: boolean,
): void {
  const token = ++generation;
  setHidden("content-sources-body", false);
  applySourceKnowledgeChrome();
  bindReader();
  closeSourceReader();
  void loadSource(sourceAccess(source, byPath), skillSource, token);
}

async function loadSource(
  access: SourceAccess,
  skillSource: boolean,
  token: number,
): Promise<void> {
  try {
    const catalog = await access.catalog();
    if (token !== generation) return;
    renderArticles(access, catalog, token);
    await mountMap(access, skillSource, token);
  } catch (err: unknown) {
    if (token !== generation) return;
    alert(tf("content_source_browse_error", { message: messageOf(err) }));
  }
}

function renderArticles(
  access: SourceAccess,
  catalog: CatalogResponse,
  token: number,
): void {
  const list = document.getElementById("content-sources-okf-list");
  const note = document.getElementById("content-sources-okf-note");
  if (!list || !note) return;
  list.replaceChildren();
  const articles = catalog.okf.found ? catalog.okf.articles : [];
  if (articles.length === 0) {
    note.textContent = t("content_source_okf_missing");
    return;
  }
  note.textContent = "";
  for (const article of articles) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "content-sources-article";
    button.textContent = article.title || article.file;
    button.addEventListener("click", () => {
      void openReader(access, article.file, token);
    });
    item.append(button);
    list.append(item);
  }
}

async function mountMap(
  access: SourceAccess,
  skillSource: boolean,
  token: number,
): Promise<void> {
  studioLoaded = true;
  const studio = await import("./knowledge-map/studio.js");
  if (token !== generation) return;
  const host = document.getElementById("content-sources-map");
  if (!host) return;
  host.replaceChildren();
  const loading = document.createElement("p");
  loading.className = "km-status";
  loading.textContent = t("km_loading");
  host.append(loading);
  await studio.mountSourceKnowledgeMap(host, {
    loadMap: () => access.map(),
    skillSource,
    openSource: (url) => {
      void openReader(access, url, token);
    },
    isCurrent: () => token === generation,
  });
}

// ── Reader dialog ────────────────────────────────────────────────────────

const MARKDOWN_FILE = /\.(md|markdown)$/i;

function readerPart(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function bindReader(): void {
  if (readerBound) return;
  const overlay = readerPart("content-source-reader-overlay");
  if (!overlay) return;
  readerBound = true;
  readerPart("btn-content-source-reader-close")?.addEventListener("click", () =>
    closeSourceReader(),
  );
  overlay.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeSourceReader();
    }
  });
  // A click on the dimmed backdrop, not inside the dialog, closes it.
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeSourceReader();
  });
}

function readerOpen(): boolean {
  return (
    readerPart("content-source-reader-overlay")?.classList.contains("active") ??
    false
  );
}

function setReaderNote(text: string): void {
  const note = readerPart("content-source-reader-note");
  if (note) note.textContent = text;
}

/** Show `content` under `title`, opening the dialog if it is closed. */
function showInReader(title: string, content: Node[], note = ""): void {
  const overlay = readerPart("content-source-reader-overlay");
  const heading = readerPart("content-source-reader-title");
  const body = readerPart("content-sources-reader-body");
  if (!overlay || !heading || !body) return;
  heading.textContent = title;
  body.replaceChildren(...content);
  body.scrollTop = 0;
  setReaderNote(note);
  if (readerOpen()) return;
  readerReturnFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  overlay.classList.add("active");
  readerPart("btn-content-source-reader-close")?.focus();
}

export function closeSourceReader(): void {
  const overlay = readerPart("content-source-reader-overlay");
  if (!overlay?.classList.contains("active")) return;
  overlay.classList.remove("active");
  readerPart("content-sources-reader-body")?.replaceChildren();
  setReaderNote("");
  if (readerReturnFocus?.isConnected) readerReturnFocus.focus();
  readerReturnFocus = null;
}

/**
 * A link inside a Markdown file that is not an OKF article, as a path from
 * the Quelle's root: relative to the file's own folder, as the file's author
 * meant it. A root-level result keeps "./" so the bridge does not look for
 * it among the OKF articles first.
 */
export function linkFromFile(file: string, link: string): string {
  const parts = file.split("/").slice(0, -1);
  for (const part of link.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === ".." && parts.length > 0 && parts[parts.length - 1] !== "..") {
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  const path = parts.join("/");
  return path.includes("/") ? path : `./${path}`;
}

function bindReaderClicks(
  article: HTMLElement,
  access: SourceAccess,
  token: number,
  /** Set for a Markdown file outside the OKF bundle: links are relative to it. */
  file: string | null,
): void {
  const open = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a");
    if (!link || !article.contains(link)) return;
    event.preventDefault();
    if (file === null) {
      const articleName = link.getAttribute("data-okf-article");
      if (articleName) {
        void openReader(access, articleName, token);
        return;
      }
      const cited = link.getAttribute("data-okf-citation");
      if (cited) {
        void openReader(access, cited, token);
        return;
      }
      setReaderNote(t("content_source_reader_refused"));
      return;
    }
    const raw =
      link.getAttribute("data-okf-article") ??
      link.getAttribute("data-okf-citation") ??
      link.getAttribute("href") ??
      "";
    // A jump inside the same file: nothing to load.
    if (raw.startsWith("#")) return;
    if (
      link.hasAttribute("data-okf-external") ||
      citationTarget(raw) === null
    ) {
      setReaderNote(t("content_source_reader_refused"));
      return;
    }
    void openReader(access, linkFromFile(file, raw), token);
  };
  article.addEventListener("click", open);
  article.addEventListener("auxclick", open);
}

function readFailure(reason: ReadResponse["reason"]): string {
  return t(
    reason === "missing"
      ? "content_source_reader_missing"
      : reason === "desktop"
        ? "content_source_desktop_only"
        : "content_source_reader_refused",
  );
}

/**
 * Open an article or a cited file in the reader dialog. A file that cannot
 * be opened leaves the article on screen, if one is shown, and says why.
 */
async function openReader(
  access: SourceAccess,
  raw: string,
  token: number,
): Promise<void> {
  const target = citationTarget(raw);
  if (!target) {
    showFailure(raw, t("content_source_reader_refused"));
    return;
  }
  try {
    const result = await access.read(target);
    if (token !== generation) return;
    if (!result.opened) {
      showFailure(target, readFailure(result.reason));
      return;
    }
    const path = result.path ?? target;
    const body = result.body ?? "";
    const markdown = result.kind === "okf" || MARKDOWN_FILE.test(path);
    if (!markdown) {
      const pre = document.createElement("pre");
      pre.className = "content-sources-text";
      pre.textContent = body;
      showInReader(path, [pre]);
      return;
    }
    const article = document.createElement("div");
    article.className = "okf-article-body";
    article.innerHTML = renderMarkdown(stripFrontmatter(body));
    bindReaderClicks(
      article,
      access,
      token,
      result.kind === "okf" ? null : path,
    );
    showInReader(path, [article]);
  } catch (err: unknown) {
    if (token !== generation) return;
    showFailure(
      target,
      tf("content_source_browse_error", { message: messageOf(err) }),
    );
  }
}

function showFailure(target: string, message: string): void {
  if (readerOpen()) setReaderNote(message);
  else showInReader(target, [], message);
}
