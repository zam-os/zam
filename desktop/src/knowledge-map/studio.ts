/**
 * The Studio's knowledge-map page (ADR 2026-10-03): loads the map of the
 * repository an agent last wrote one for (or the active workspace) through
 * the bridge and mounts the shell with the view picked in Settings. Without a
 * usable map it shows ZAM's own map as an example, never a dead end.
 *
 * Loaded lazily from main.ts only when the alpha is on and the page opens.
 * Tauri stays out: main.ts injects folder picking and link opening.
 */

import {
  buildMapIndex,
  type KnowledgeMap,
  type MapIssue,
  validateKnowledgeMap,
} from "../../../src/cli/knowledge-map/model.js";
import { runBridge } from "../bridge-transport.js";
import { t, tf } from "../i18n.js";
import { parseKnowledgeMapViewId } from "./registry.js";
import {
  type FeedbackStore,
  mountKnowledgeMap,
  type ShellHandle,
} from "./shell.js";
import { ensureKnowledgeMapStyles } from "./styles.js";

export interface StudioMapDeps {
  openUrl(url: string): void;
  /** A folder chosen by the learner, or null when cancelled. */
  pickFolder(): Promise<string | null>;
  copyText(text: string): Promise<boolean>;
}

interface FeatureResponse {
  enabled: boolean;
  view: string | null;
  repoPath: string | null;
}

interface MapResponse {
  repo: string | null;
  found: boolean;
  map: KnowledgeMap | null;
  issues: MapIssue[];
}

interface FeedbackListResponse {
  entries: unknown[];
}

const bridgeFeedback: FeedbackStore = {
  async save(entry) {
    const args = ["--view", entry.view, "--helpful", String(entry.helpful)];
    if (entry.found) args.push("--found", entry.found);
    if (entry.comment.trim()) args.push("--comment", entry.comment.trim());
    await runBridge("knowledge-map-feedback", args);
  },
  async count() {
    const list = await runBridge<FeedbackListResponse>(
      "knowledge-map-feedback",
      ["--list"],
    );
    return list.entries?.length ?? 0;
  },
  async exportText() {
    const list = await runBridge<FeedbackListResponse>(
      "knowledge-map-feedback",
      ["--list"],
    );
    return JSON.stringify(list.entries ?? [], null, 2);
  },
};

async function sampleMap(): Promise<KnowledgeMap | null> {
  const module = await import("../../../docs/knowledge-map/map.json");
  return validateKnowledgeMap(module.default).map;
}

let shell: ShellHandle | null = null;

export async function openKnowledgeMapView(
  container: HTMLElement,
  deps: StudioMapDeps,
): Promise<void> {
  ensureKnowledgeMapStyles();
  shell?.destroy();
  shell = null;
  container.replaceChildren();
  const loading = document.createElement("p");
  loading.className = "km-status";
  loading.textContent = t("km_loading");
  container.appendChild(loading);

  try {
    const [feature, loaded] = await Promise.all([
      runBridge<FeatureResponse>("knowledge-map-feature"),
      runBridge<MapResponse>("knowledge-map"),
    ]);

    let map = loaded.map;
    const notices: string[] = [];
    if (!map) {
      map = await sampleMap();
      if (loaded.found) {
        notices.push(
          [
            t("km_invalid"),
            ...loaded.issues
              .filter((issue) => issue.level === "error")
              .slice(0, 8)
              .map(
                (issue) =>
                  `• ${issue.id ? `${issue.id}: ` : ""}${issue.message}`,
              ),
          ].join("\n"),
        );
      } else {
        notices.push(t("km_sample_note"));
      }
    }
    if (!map) throw new Error(t("km_load_failed"));

    // Repository line: which map this is, and how to switch or build one.
    const toolbar = document.createElement("div");
    toolbar.className = "km-notice km-error";
    toolbar.style.display = "flex";
    toolbar.style.flexWrap = "wrap";
    toolbar.style.gap = "6px 12px";
    toolbar.style.alignItems = "center";
    const repoLine = document.createElement("span");
    repoLine.textContent = loaded.repo
      ? `${t("km_repo_label")}: ${loaded.repo}`
      : t("km_no_repo");
    const pick = document.createElement("button");
    pick.type = "button";
    pick.className = "km-link";
    pick.textContent = t("km_pick_repo");
    pick.addEventListener("click", async () => {
      const folder = await deps.pickFolder();
      if (!folder) return;
      await runBridge("knowledge-map-feature", ["--repo", folder]);
      await openKnowledgeMapView(container, deps);
    });
    const reload = document.createElement("button");
    reload.type = "button";
    reload.className = "km-link";
    reload.textContent = t("km_reload");
    reload.addEventListener(
      "click",
      () => void openKnowledgeMapView(container, deps),
    );
    toolbar.append(repoLine, pick, reload);
    if (!loaded.map) {
      const ask = document.createElement("span");
      const request = t("km_agent_request");
      ask.textContent = `${t("km_ask_agent")} ${request}`;
      toolbar.appendChild(ask);
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "km-link";
      copy.textContent = t("km_copy");
      copy.addEventListener("click", () => void deps.copyText(request));
      toolbar.appendChild(copy);
    }

    const host = document.createElement("div");
    host.style.display = "flex";
    host.style.flexDirection = "column";
    host.style.gap = "10px";
    const mapRoot = document.createElement("div");
    container.replaceChildren(host);
    host.append(toolbar, mapRoot);

    shell = await mountKnowledgeMap(mapRoot, {
      index: buildMapIndex(map),
      viewId: parseKnowledgeMapViewId(feature.view),
      t,
      tf,
      showViewSwitcher: false,
      notice: notices.length > 0 ? notices.join("\n") : undefined,
      openSource: deps.openUrl,
      feedback: bridgeFeedback,
      copyText: deps.copyText,
    });
  } catch (err) {
    container.replaceChildren();
    const error = document.createElement("p");
    error.className = "km-notice km-error";
    error.textContent = `${t("km_load_failed")} ${err instanceof Error ? err.message : String(err)}`;
    container.appendChild(error);
  }
}
