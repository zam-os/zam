/**
 * The knowledge map as a page of its own: one repository's map with all
 * views, switchable in place. Vite builds this into
 * `dist/ui/knowledge-map-viewer.html` with an empty data slot, and
 * `zam knowledge-map view` writes a copy with the repository's map in it
 * (ADR 2026-10-03). Not part of the Studio bundle and needs no host.
 */

import {
  buildMapIndex,
  type KnowledgeMap,
  validateKnowledgeMap,
} from "../../../src/cli/knowledge-map/model.js";
import {
  MAP_DATA_ELEMENT_ID,
  MAP_DATA_PLACEHOLDER,
} from "../../../src/cli/knowledge-map/viewer-slots.js";
import { setCurrentLocale, t, tf } from "../i18n.js";
import {
  type KnowledgeMapViewId,
  parseKnowledgeMapViewId,
} from "./registry.js";
import {
  type FeedbackInput,
  type FeedbackStore,
  mountKnowledgeMap,
  type ShellHandle,
} from "./shell.js";

const VIEW_KEY = "zam-km-viewer-view";

type Lang = "de" | "en";

/** The map embedded in the page, or why there is none to show. */
export function parseEmbeddedMap(
  text: string | null | undefined,
): { map: KnowledgeMap } | { error: string } {
  const raw = text?.trim() ?? "";
  if (!raw || raw === MAP_DATA_PLACEHOLDER) {
    return {
      error:
        "This page has no knowledge map in it. Open one with `zam knowledge-map view --repo <path>`.",
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "The knowledge map in this page is not valid JSON." };
  }
  const { map, issues } = validateKnowledgeMap(parsed);
  if (!map) {
    return {
      error: issues
        .filter((issue) => issue.level === "error")
        .map((issue) => issue.message)
        .join("\n"),
    };
  }
  return { map };
}

function intro(lang: Lang, title: string, hasC4: boolean) {
  if (lang === "de") {
    return {
      label: "Wissenskarte",
      text: `Mehrere Ansichten derselben Wissenskarte über ${title}${hasC4 ? ", darunter eine C4-Architektur" : ""}. Klick auf eine Aussage, um sie in den Fokus zu holen; oben rechts wechselst du die Ansicht. Rückmeldungen bleiben in diesem Browser.`,
    };
  }
  return {
    label: "Knowledge map",
    text: `Several views of the same knowledge map about ${title}${hasC4 ? ", including a C4 architecture" : ""}. Click a statement to bring it into focus; switch the view at the top right. Feedback stays in this browser.`,
  };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked (private window, preview): feedback lives for this visit.
  }
}

/** Feedback kept per map, so two repositories' pages do not mix theirs. */
function localFeedback(map: KnowledgeMap): FeedbackStore {
  const key = `zam-km-viewer-feedback:${map.title}`;
  const memory: Array<FeedbackInput & { at: string }> = [];
  return {
    async save(entry) {
      const all = readJson(key, memory);
      const next = [...all, { ...entry, at: new Date().toISOString() }];
      memory.splice(0, memory.length, ...next);
      writeJson(key, next);
    },
    async count() {
      return readJson(key, memory).length;
    },
    async exportText() {
      return JSON.stringify(readJson(key, memory), null, 2);
    },
  };
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function start(): void {
  const app = document.getElementById("app");
  const bar = document.getElementById("viewer-bar");
  if (!app || !bar) return;

  const embedded = parseEmbeddedMap(
    document.getElementById(MAP_DATA_ELEMENT_ID)?.textContent,
  );
  if ("error" in embedded) {
    const message = document.createElement("p");
    message.className = "viewer-error";
    message.textContent = embedded.error;
    app.replaceChildren(message);
    return;
  }
  const { map } = embedded;
  const index = buildMapIndex(map);
  const hasC4 = map.statements.some((statement) => statement.c4 !== undefined);
  const feedback = localFeedback(map);

  let lang: Lang = navigator.language?.toLowerCase().startsWith("de")
    ? "de"
    : "en";
  let viewId: KnowledgeMapViewId = parseKnowledgeMapViewId(
    readJson<string>(VIEW_KEY, "focus"),
  );
  let shell: ShellHandle | null = null;

  const introLine = document.createElement("p");
  introLine.className = "viewer-intro";
  const langGroup = document.createElement("div");
  langGroup.className = "viewer-lang";
  langGroup.setAttribute("role", "group");
  langGroup.setAttribute("aria-label", "Sprache / Language");
  bar.append(introLine, langGroup);

  const render = async () => {
    setCurrentLocale(lang);
    document.documentElement.lang = lang;
    const words = intro(lang, map.title, hasC4);
    introLine.replaceChildren();
    const label = document.createElement("strong");
    label.textContent = words.label;
    introLine.append(label, ` ${words.text}`);
    langGroup.replaceChildren();
    for (const option of ["de", "en"] as const) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = option.toUpperCase();
      button.setAttribute("aria-pressed", String(option === lang));
      button.addEventListener("click", () => {
        if (option === lang) return;
        lang = option;
        void render();
      });
      langGroup.appendChild(button);
    }
    shell?.destroy();
    shell = await mountKnowledgeMap(app, {
      index,
      viewId,
      t,
      tf,
      showViewSwitcher: true,
      feedback,
      copyText,
      onViewChange: (id) => {
        viewId = id;
        writeJson(VIEW_KEY, id);
      },
    });
  };
  void render();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
}
