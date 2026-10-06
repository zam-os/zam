import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { setBridgeTransport } from "../../desktop/src/bridge-transport.js";
import { setCurrentLocale } from "../../desktop/src/i18n.js";
import {
  AUTO_OPEN_WINDOW_MS,
  analysisLine,
  COLLAPSE_BONUS_AFTER,
  changedAreas,
  confirmArgs,
  confirmCounts,
  confirmLabel,
  freshHarnessImport,
  initialChoices,
  isChoosable,
  pendingBannerText,
  previewNote,
  refreshPendingMaterialImports,
  reimportNotice,
  reviewGroups,
  reviewSourceLine,
  startsCollapsed,
} from "../../desktop/src/material-review.js";
import type {
  MaterialImportReviewResponse,
  MaterialImportRowWire,
} from "../../src/bridge/protocol.js";

/** ADR 2026-10-05: the Studio's review list for photo and file imports. */

const proposalRow = (
  index: number,
  preset: "yes" | "bonus" | "no" | null,
): MaterialImportRowWire => ({
  kind: "proposal",
  id: `p:${index}`,
  proposalIndex: index,
  preset,
});

const existingRow = (
  index: number,
  held: boolean,
  preset: "yes" | "bonus" | null,
): MaterialImportRowWire => ({
  kind: "existing",
  id: `e:${index}`,
  besideProposal: index,
  preset,
  held,
  score: 0.9,
  via: "lexical",
  target: { type: "token", tokenId: "01JTOKEN00000000000000000A" },
  question: "Woran erkennt man Stoffe am Aussehen?",
  answer: "Farbe, Aggregatzustand, Glanz",
  title: "Aussehen",
  area: "chemie",
});

const continuationRow: MaterialImportRowWire = {
  kind: "continuation",
  id: "c:01K4C8S0000000000000000J03",
  preset: "bonus",
  target: {
    type: "cell-item",
    cellId: "de-by:realschule-8-chemie-stoffe-stoffgemische-trennung",
    atomId: "01K4C8S0000000000000000A02",
    itemId: "01K4C8S0000000000000000J03",
  },
  question: "Wie ist die Dichte definiert?",
  answer: "ρ = m / V",
  title: "Stoffeigenschaften",
  area: "chemie/allgemeine-chemie",
};

function review(rows: MaterialImportRowWire[]): MaterialImportReviewResponse {
  return {
    success: true,
    id: "01JIMPORT0000000000000000A",
    createdAt: "2026-10-05T10:00:00.000Z",
    origin: "harness",
    harness: "opencode",
    readBy: null,
    sentTo: [],
    analysis: {
      kind: "own-notes",
      title: "Stofferkennung mit den Sinnen",
      subjects: ["chemie"],
      topic: "Stoffe und Stoffeigenschaften",
      level: "Realschule, Anfangsunterricht",
      bloom: [1, 2],
      leadsTo: null,
    },
    proposals: [0, 1, 2].map((index) => ({
      question: `Frage ${index}`,
      answer: `Antwort ${index}`,
      title: null,
      bloom: 1,
      file: 0,
      page: 1,
      area: index < 2 ? "chemie/stoffe" : "physik",
      origin: "page" as const,
      hardToRead: false,
    })),
    files: [
      {
        name: "IMG_1234.HEIC",
        sourceLink: "photo:IMG_1234.HEIC@2026-10-05",
        sha256: null,
        path: null,
      },
    ],
    rows,
    areaGroups: [
      { area: "chemie/stoffe", proposalIndexes: [0, 1] },
      { area: "physik", proposalIndexes: [2] },
    ],
    reimports: [],
    semantic: false,
  };
}

afterEach(() => {
  setCurrentLocale("en");
  setBridgeTransport(async () => {
    throw new Error("no transport in this test");
  });
});

describe("material review rules", () => {
  it("starts every choosable row on its preset and leaves held items out", () => {
    const rows = [
      proposalRow(0, null),
      existingRow(0, false, "yes"),
      proposalRow(1, null),
      existingRow(1, true, null),
      proposalRow(2, "bonus"),
    ];
    expect(isChoosable(rows[3])).toBe(false);
    expect(initialChoices(rows)).toEqual({
      "p:0": null,
      "e:0": "yes",
      "p:1": null,
      "p:2": "bonus",
    });
  });

  it("counts unsaved rows so nothing drops out silently", () => {
    const rows = [
      proposalRow(0, "yes"),
      proposalRow(1, "bonus"),
      proposalRow(2, null),
      existingRow(2, true, null),
    ];
    const counts = confirmCounts(rows, {
      "p:0": "yes",
      "p:1": "bonus",
      "p:2": null,
    });
    expect(counts).toEqual({ yes: 1, bonus: 1, notSaved: 1 });
    expect(confirmLabel(counts)).toBe("Add 1 · 1 as Bonus · 1 not saved");
    expect(confirmLabel({ yes: 3, bonus: 0, notSaved: 0 })).toBe("Add 3");
    setCurrentLocale("de");
    expect(confirmLabel(counts)).toBe(
      "1 übernehmen · 1 als Bonus · 1 nicht gespeichert",
    );
  });

  it("sends only chosen rows and only changed areas", () => {
    expect(
      changedAreas({ chemie: " chemie ", physik: "Physik/Optik", x: "" }),
    ).toEqual({ physik: "Physik/Optik" });
    expect(
      confirmArgs(
        "01JIMPORT0000000000000000A",
        { "p:0": "yes", "p:1": null, "e:1": "bonus", "p:2": "no" },
        {},
      ),
    ).toEqual([
      "--id",
      "01JIMPORT0000000000000000A",
      "--decisions",
      JSON.stringify({ "p:0": "yes", "e:1": "bonus", "p:2": "no" }),
    ]);
    expect(
      confirmArgs("01JIMPORT0000000000000000A", {}, { physik: "Physik" }),
    ).toContain("--areas");
  });

  it("groups rows by area, with each match right after its proposal", () => {
    const rows = [
      proposalRow(0, null),
      existingRow(0, false, "yes"),
      proposalRow(1, "yes"),
      proposalRow(2, "yes"),
      continuationRow,
    ];
    const { groups, continuations } = reviewGroups(review(rows));
    expect(groups.map((group) => group.area)).toEqual([
      "chemie/stoffe",
      "physik",
    ]);
    expect(groups[0].rows.map((row) => row.id)).toEqual(["p:0", "e:0", "p:1"]);
    expect(groups[1].rows.map((row) => row.id)).toEqual(["p:2"]);
    expect(continuations.map((row) => row.id)).toEqual([continuationRow.id]);
  });

  it("folds Bonus rows only on long lists", () => {
    const choices = { "p:0": "bonus" as const };
    expect(startsCollapsed(proposalRow(0, "bonus"), choices, 5)).toBe(false);
    expect(
      startsCollapsed(
        proposalRow(0, "bonus"),
        choices,
        COLLAPSE_BONUS_AFTER + 1,
      ),
    ).toBe(true);
  });

  it("summarises the analysis and earlier imports", () => {
    expect(analysisLine(review([]).analysis)).toBe(
      "chemie · Stoffe und Stoffeigenschaften · Realschule, Anfangsunterricht",
    );
    expect(reimportNotice([])).toBeNull();
    expect(
      reimportNotice(
        [{ sourceId: "s", title: null, createdAt: "2026-10-05T10:00:00.000Z" }],
        "en",
      ),
    ).toBe("You imported this file on Oct 5.");
    setCurrentLocale("de");
    expect(
      reimportNotice(
        [{ sourceId: "s", title: null, createdAt: "2026-10-05T10:00:00.000Z" }],
        "de",
      ),
    ).toBe("Diese Datei hast du am 5. Okt. schon importiert.");
  });

  it("names the harness, or the model that read the pages here", () => {
    setCurrentLocale("en");
    const studio = { harness: null, readBy: "Luna", sentTo: ["Luna"] };
    expect(reviewSourceLine(review([]))).toBe("Proposed by opencode.");
    expect(reviewSourceLine(studio)).toBe("Read by Luna.");
    // The dialog named Gemma; it failed, and Luna answered.
    expect(reviewSourceLine({ ...studio, sentTo: ["Gemma", "Luna"] })).toBe(
      "Sent to Gemma, Luna; read by Luna.",
    );
    expect(
      reviewSourceLine({ harness: null, readBy: null, sentTo: [] }),
    ).toBeNull();
    setCurrentLocale("de");
    expect(reviewSourceLine({ ...studio, sentTo: ["Gemma", "Luna"] })).toBe(
      "Gesendet an Gemma, Luna; gelesen von Luna.",
    );
  });

  it("words the banner and the preview notes", () => {
    expect(pendingBannerText([])).toBeNull();
    const entry = {
      id: "01JIMPORT0000000000000000A",
      title: "Stofferkennung mit den Sinnen",
      createdAt: "2026-10-05T10:00:00.000Z",
      origin: "harness" as const,
      harness: "opencode",
      proposalCount: 4,
    };
    expect(pendingBannerText([entry])).toBe(
      "An import is waiting for your review: Stofferkennung mit den Sinnen",
    );
    expect(pendingBannerText([entry, entry])).toBe(
      "2 imports are waiting for your review.",
    );
    expect(
      previewNote({
        success: true,
        name: "a.pdf",
        path: "/x/a.pdf",
        kind: "pdf",
        dataUrl: null,
        reason: "not-viewable",
      }),
    ).toMatch(/open it next to this list/);
  });
});

describe("opening a fresh harness import by itself", () => {
  const now = Date.parse("2026-10-05T10:05:00.000Z");
  const entry = (
    id: string,
    origin: "harness" | "studio",
    createdAt: string,
  ) => ({
    id,
    title: "Stofferkennung",
    createdAt,
    origin,
    harness: origin === "harness" ? "opencode" : null,
    proposalCount: 4,
  });

  it("opens a harness batch the agent just submitted, once", () => {
    const fresh = entry("01JA", "harness", "2026-10-05T10:04:00.000Z");
    expect(freshHarnessImport([fresh], new Set(), now)).toBe(fresh);
    expect(freshHarnessImport([fresh], new Set(["01JA"]), now)).toBeNull();
  });

  it("leaves older and Studio-made batches behind the banner", () => {
    const old = entry(
      "01JB",
      "harness",
      new Date(now - AUTO_OPEN_WINDOW_MS - 1000).toISOString(),
    );
    const studio = entry("01JC", "studio", "2026-10-05T10:04:00.000Z");
    expect(freshHarnessImport([old, studio], new Set(), now)).toBeNull();
  });
});

describe("material review bridge calls", () => {
  it("asks for waiting imports and survives a failing bridge", async () => {
    const calls: string[] = [];
    setBridgeTransport(async (cmd) => {
      calls.push(cmd);
      return { success: true, imports: [] };
    });
    expect(await refreshPendingMaterialImports()).toEqual([]);
    expect(calls).toEqual(["material-import-pending"]);

    setBridgeTransport(async () => {
      throw new Error("bridge down");
    });
    await expect(refreshPendingMaterialImports()).resolves.toEqual([]);
  });
});

describe("material review wiring", () => {
  const root = process.cwd();
  const view = readFileSync(
    join(root, "desktop", "src", "material-review.ts"),
    "utf8",
  );
  const studio = readFileSync(
    join(root, "desktop", "src", "learning-content.ts"),
    "utf8",
  );

  it("is started by the Learning Content Studio in both hosts", () => {
    expect(studio).toContain("initMaterialImports(materialReview);");
    expect(studio).toContain("await loadStudioData();");
  });

  it("drops review and preview responses from an earlier open", () => {
    const section = (name: string) =>
      view.slice(view.indexOf(name), view.indexOf("\n}\n", view.indexOf(name)));
    const open = section("export async function openMaterialReview");
    expect(open).toContain("const stamp = ++generation;");
    // Checked after the await, on success and on error alike.
    expect(open.match(/if \(stamp !== generation\) return;/g)).toHaveLength(2);
    expect(open).toContain("loadPreviews(parts, review, stamp)");
    expect(section("async function loadPreviews")).toContain(
      "if (stamp !== generation) return;",
    );
    expect(section("export function closeMaterialReview")).toContain(
      "generation++;",
    );
    expect(section("async function confirmCurrent")).toContain("generation++;");
  });

  it("uses the dedicated bridge commands", () => {
    for (const cmd of [
      "material-import-pending",
      "material-import-review",
      "material-import-confirm",
      "material-import-discard",
      "material-import-file-preview",
      "material-import-areas",
    ]) {
      expect(view).toContain(`"${cmd}"`);
    }
  });

  it("refreshes the waiting imports when the window comes back", () => {
    expect(view).toContain('window.addEventListener("focus"');
    expect(view).toContain('"visibilitychange"');
  });

  it("asks once before discarding", () => {
    expect(view).toContain(
      'window.confirm(t("material_review_discard_confirm"))',
    );
  });
});
