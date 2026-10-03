/**
 * Standalone, browsable prototype of the knowledge map: ZAM's own map with all
 * views, switchable in place. Built into one HTML file by
 * `scripts/build-knowledge-map-prototype.mjs`; not part of the Studio bundle.
 */

import zamMap from "../../../docs/knowledge-map/map.json";
import {
  buildMapIndex,
  validateKnowledgeMap,
} from "../../../src/cli/knowledge-map/model.js";
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

const FEEDBACK_KEY = "zam-km-prototype-feedback";
const VIEW_KEY = "zam-km-prototype-view";

type Lang = "de" | "en";

const INTRO: Record<Lang, { label: string; text: string }> = {
  de: {
    label: "Prototyp",
    text: "Drei Ansichten derselben Wissenskarte über ZAM. Klick auf eine Aussage, um sie in den Fokus zu holen; oben rechts wechselst du die Ansicht. Rückmeldungen bleiben in diesem Browser.",
  },
  en: {
    label: "Prototype",
    text: "Three views of the same knowledge map about ZAM. Click a statement to bring it into focus; switch the view at the top right. Feedback stays in this browser.",
  },
};

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

const memoryFeedback: Array<FeedbackInput & { at: string }> = [];

const feedbackStore: FeedbackStore = {
  async save(entry) {
    const all = readJson(FEEDBACK_KEY, memoryFeedback);
    const next = [...all, { ...entry, at: new Date().toISOString() }];
    memoryFeedback.splice(0, memoryFeedback.length, ...next);
    writeJson(FEEDBACK_KEY, next);
  },
  async count() {
    return readJson(FEEDBACK_KEY, memoryFeedback).length;
  },
  async exportText() {
    return JSON.stringify(readJson(FEEDBACK_KEY, memoryFeedback), null, 2);
  },
};

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
  const bar = document.getElementById("proto-bar");
  if (!app || !bar) return;

  const { map, issues } = validateKnowledgeMap(zamMap);
  if (!map) {
    app.textContent = issues.map((issue) => issue.message).join("\n");
    return;
  }
  const index = buildMapIndex(map);

  let lang: Lang = navigator.language?.toLowerCase().startsWith("de")
    ? "de"
    : "en";
  let viewId: KnowledgeMapViewId = parseKnowledgeMapViewId(
    readJson<string>(VIEW_KEY, "focus"),
  );
  let shell: ShellHandle | null = null;

  const intro = document.createElement("p");
  intro.className = "proto-intro";
  const langGroup = document.createElement("div");
  langGroup.className = "proto-lang";
  langGroup.setAttribute("role", "group");
  langGroup.setAttribute("aria-label", "Sprache / Language");
  bar.append(intro, langGroup);

  const render = async () => {
    setCurrentLocale(lang);
    document.documentElement.lang = lang;
    intro.replaceChildren();
    const label = document.createElement("strong");
    label.textContent = INTRO[lang].label;
    intro.append(label, ` ${INTRO[lang].text}`);
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
      feedback: feedbackStore,
      copyText,
      onViewChange: (id) => {
        viewId = id;
        writeJson(VIEW_KEY, id);
      },
    });
  };
  void render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
