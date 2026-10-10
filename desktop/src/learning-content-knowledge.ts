/**
 * What a Quelle shows once its directory is there (ADR 2026-10-10,
 * Decisions 6–8).
 *
 * The OKF list loads with the switcher. The knowledge-map module loads only
 * when the alpha switch is on. Turning that switch on uses the existing
 * Settings flag. Citations open in the reader on this page. A URL or a path
 * outside the Quelle is refused, and the operating system is not asked to
 * open it. This module does not repair a workspace, upsert an article, or
 * write a knowledge map.
 */

import { citationTarget } from "../../src/cli/learning-content/citation.js";
import { runBridge } from "./bridge-transport.js";
import { t, tf } from "./i18n.js";
import { renderMarkdown, stripFrontmatter } from "./panel/okf-render.js";

interface FeatureResponse {
  enabled: boolean;
}

interface SourceArticle {
  file: string;
  title: string;
}

interface CatalogResponse {
  okf: { found: false } | { found: true; articles: SourceArticle[] };
}

interface ReadResponse {
  opened: boolean;
  reason?: "outside" | "missing";
  kind?: "okf" | "text";
  path?: string;
  body?: string;
}

let generation = 0;
let studioLoaded = false;

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
  const enable = document.getElementById("btn-content-source-map");
  if (enable) enable.textContent = t("btn_content_source_map");
}

export function clearSourceKnowledge(): void {
  generation += 1;
  setHidden("content-sources-body", true);
  document.getElementById("content-sources-map")?.replaceChildren();
  document.getElementById("content-sources-okf-list")?.replaceChildren();
  const note = document.getElementById("content-sources-okf-note");
  if (note) note.textContent = "";
  const body = document.getElementById("content-sources-reader-body");
  if (body) body.textContent = "";
  if (!studioLoaded) return;
  void import("./knowledge-map/studio.js").then((mod) => {
    mod.clearSourceKnowledgeMap();
  });
}

export function showSourceKnowledge(repo: string, skillSource: boolean): void {
  const token = ++generation;
  setHidden("content-sources-body", false);
  applySourceKnowledgeChrome();
  const reader = document.getElementById("content-sources-reader-body");
  if (reader) reader.textContent = t("content_source_reader_empty");
  void loadSource(repo, skillSource, token);
}

async function loadSource(
  repo: string,
  skillSource: boolean,
  token: number,
): Promise<void> {
  try {
    const [feature, catalog] = await Promise.all([
      runBridge<FeatureResponse>("knowledge-map-feature"),
      runBridge<CatalogResponse>("learning-content-browse", ["--repo", repo]),
    ]);
    if (token !== generation) return;
    renderArticles(repo, catalog, token);
    if (feature.enabled !== true) {
      if (studioLoaded) {
        const studio = await import("./knowledge-map/studio.js");
        if (token !== generation) return;
        studio.clearSourceKnowledgeMap();
      }
      renderEnableButton(repo, skillSource, token);
      return;
    }
    await mountMap(repo, skillSource, token);
  } catch (err: unknown) {
    if (token !== generation) return;
    alert(tf("content_source_browse_error", { message: messageOf(err) }));
  }
}

function renderArticles(
  repo: string,
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
      void openReader(repo, article.file, token);
    });
    item.append(button);
    list.append(item);
  }
}

function renderEnableButton(
  repo: string,
  skillSource: boolean,
  token: number,
): void {
  const host = document.getElementById("content-sources-map");
  if (!host) return;
  host.replaceChildren();
  const button = document.createElement("button");
  button.id = "btn-content-source-map";
  button.type = "button";
  button.className = "btn secondary-btn btn-sm";
  button.textContent = t("btn_content_source_map");
  button.addEventListener("click", () => {
    void enableMap(repo, skillSource, token);
  });
  host.append(button);
}

async function enableMap(
  repo: string,
  skillSource: boolean,
  token: number,
): Promise<void> {
  if (token !== generation) return;
  try {
    await runBridge("knowledge-map-feature", ["--enable"]);
    if (token !== generation) return;
    await mountMap(repo, skillSource, token);
  } catch (err: unknown) {
    if (token !== generation) return;
    alert(tf("content_source_browse_error", { message: messageOf(err) }));
  }
}

async function mountMap(
  repo: string,
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
    repo,
    skillSource,
    openSource: (url) => {
      void openReader(repo, url, token);
    },
    isCurrent: () => token === generation,
  });
}

function bindReaderClicks(
  article: HTMLElement,
  repo: string,
  token: number,
): void {
  const open = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a");
    if (!link || !article.contains(link)) return;
    event.preventDefault();
    const articleName = link.getAttribute("data-okf-article");
    if (articleName) {
      void openReader(repo, articleName, token);
      return;
    }
    const cited = link.getAttribute("data-okf-citation");
    if (cited) {
      void openReader(repo, cited, token);
      return;
    }
    const body = document.getElementById("content-sources-reader-body");
    if (body) body.textContent = t("content_source_reader_refused");
  };
  article.addEventListener("click", open);
  article.addEventListener("auxclick", open);
}

async function openReader(
  repo: string,
  raw: string,
  token: number,
): Promise<void> {
  const body = document.getElementById("content-sources-reader-body");
  if (!body) return;
  const target = citationTarget(raw);
  if (!target) {
    body.textContent = t("content_source_reader_refused");
    return;
  }
  try {
    const result = await runBridge<ReadResponse>("learning-content-browse", [
      "--repo",
      repo,
      "--target",
      target,
    ]);
    if (token !== generation) return;
    if (!result.opened) {
      body.textContent = t(
        result.reason === "missing"
          ? "content_source_reader_missing"
          : "content_source_reader_refused",
      );
      return;
    }
    if (result.kind === "okf") {
      const heading = document.createElement("p");
      heading.className = "content-sources-reader-path";
      heading.textContent = result.path ?? target;
      const article = document.createElement("div");
      article.className = "okf-article-body";
      article.innerHTML = renderMarkdown(stripFrontmatter(result.body ?? ""));
      bindReaderClicks(article, repo, token);
      body.replaceChildren(heading, article);
      return;
    }
    const pre = document.createElement("pre");
    pre.className = "content-sources-text";
    pre.textContent = result.body ?? "";
    body.replaceChildren(pre);
  } catch (err: unknown) {
    if (token !== generation) return;
    body.textContent = tf("content_source_browse_error", {
      message: messageOf(err),
    });
  }
}
