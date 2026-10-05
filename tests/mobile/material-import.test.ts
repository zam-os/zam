import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setLocale } from "../../mobile/src/i18n.js";
import {
  analyzeMaterialOnDevice,
  confirmMaterialOnDevice,
  type DeviceMaterialFile,
  deviceSourceLink,
  listImportBonus,
  resolveMaterialEndpoints,
  reviewMaterialOnDevice,
  sha256Hex,
  takeImportBonus,
} from "../../mobile/src/material-import.js";
import {
  confirmText,
  createReviewState,
  reimportText,
} from "../../mobile/src/material-review-view.js";
import { CLOUD_MODELS_SETTING } from "../../mobile/src/model-registry.js";
import { importBonusOffer } from "../../mobile/src/study-offers.js";
import type { VisionRequestFn } from "../../mobile/src/vl-import.js";
import {
  buildReviewQueue,
  type Database,
  getCard,
  openDatabase,
  setSetting,
} from "../../src/kernel/index.js";

/**
 * Learning cards from photos and PDFs on the phone (ADR 2026-10-05, Phase 8):
 * read, match and commit on the device database, with no staging file. The
 * material is synthetic and the model is mocked.
 */

const FIXTURE = JSON.parse(
  readFileSync(
    join(__dirname, "../fixtures/material-import/chemie-sinne.json"),
    "utf8",
  ),
) as { analysis: unknown; proposals: Array<Record<string, unknown>> };
const USER = "learner";

function cloudRow(id: string, caps: string[], order = 0) {
  const flags = Object.fromEntries(caps.map((cap) => [cap, true]));
  return {
    id,
    label: id,
    url: "https://openrouter.ai/api/v1",
    model: `vendor/${id}`,
    apiKey: "sk-or",
    apiFlavor: "chat-completions",
    order,
    capabilities: flags,
    detectedCapabilities: flags,
  };
}

function answer(proposals = FIXTURE.proposals): string {
  return JSON.stringify({
    choices: [
      {
        message: {
          content: JSON.stringify({ analysis: FIXTURE.analysis, proposals }),
        },
      },
    ],
  });
}

function photo(name: string, base64 = "AAAA"): DeviceMaterialFile {
  return { name, kind: "image", mime: "image/jpeg", base64, sha256: null };
}

describe("material import on the phone", () => {
  let dir: string;
  let db: Database;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-mobile-material-"));
    db = await openDatabase({
      dbPath: join(dir, "device.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    setLocale("de");
  });

  afterEach(async () => {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("finds photo models in the registry, then in the old vision settings", async () => {
    expect(await resolveMaterialEndpoints(db, "image")).toEqual([]);
    await setSetting(db, "llm.vision.enabled", "true");
    await setSetting(db, "llm.vision.url", "https://api.example.com/v1");
    await setSetting(db, "llm.vision.model", "vision-old");
    expect(
      (await resolveMaterialEndpoints(db, "image")).map((e) => e.model),
    ).toEqual(["vision-old"]);
    // No PDF without a detected file row (D1), whatever the old settings say.
    expect(await resolveMaterialEndpoints(db, "pdf")).toEqual([]);

    await setSetting(
      db,
      CLOUD_MODELS_SETTING,
      JSON.stringify([
        cloudRow("luna", ["text", "image", "file"], 0),
        cloudRow("glm", ["text", "image"], 1),
      ]),
    );
    expect(await resolveMaterialEndpoints(db, "image")).toMatchObject([
      { model: "vendor/luna", readsPdf: false },
      { model: "vendor/glm", readsPdf: false },
    ]);
    expect(await resolveMaterialEndpoints(db, "pdf")).toMatchObject([
      { model: "vendor/luna", label: "luna", readsPdf: true },
    ]);
  });

  it("reads, matches and commits on the device, with Bonus kept off the queue", async () => {
    const requests: string[] = [];
    const request: VisionRequestFn = async ({ body }) => {
      requests.push(body);
      return answer();
    };
    const now = new Date(2026, 9, 5, 12);
    const analysis = await analyzeMaterialOnDevice(
      db,
      [{ ...photo("IMG_1234.HEIC"), sha256: "a".repeat(64) }],
      {
        endpoints: [
          {
            url: "https://openrouter.ai/api/v1",
            model: "vendor/luna",
            label: "Luna",
            readsPdf: false,
          },
        ],
        locale: "de",
        request,
        now,
      },
    );
    expect(requests).toHaveLength(1);
    expect(analysis.model).toBe("Luna");
    expect(analysis.set.files).toEqual([
      {
        name: "IMG_1234.HEIC",
        sourceLink: "photo:IMG_1234.HEIC@2026-10-05",
        sha256: "a".repeat(64),
        // The phone has no path to keep.
        path: null,
      },
    ]);

    const review = await reviewMaterialOnDevice(db, USER, analysis.set);
    const state = createReviewState(review, analysis.model);
    expect(state.choices).toMatchObject({ "p:0": "yes", "p:2": "bonus" });
    expect(confirmText({ yes: 1, bonus: 1, notSaved: 2 })).toBe(
      "1 übernehmen · 1 als Bonus · 2 nicht gespeichert",
    );

    const result = await confirmMaterialOnDevice(
      db,
      USER,
      review,
      state.choices,
      { "chemie/stoffe-und-eigenschaften": "chemie/stoffe" },
    );
    // Bonus: the extra card, and the Chemie 8 item the material leads to.
    expect(state.choices).toMatchObject({
      "c:01K4C8S0000000000000000J03": "bonus",
    });
    expect(result).toMatchObject({ cardsCreated: 1, bonusKept: 2 });
    const queue = await buildReviewQueue(db, { userId: USER, maxNew: 20 });
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0].domain).toBe("chemie/stoffe");

    // The bonus item waits for the offer after the due queue.
    const items = await listImportBonus(db, USER);
    const offer = importBonusOffer(items);
    expect(offer?.sourceTitle).toBe("Stofferkennung mit den Sinnen");
    expect(offer?.titles).toHaveLength(2);
    expect(offer?.titles).toContain("Geruchsprobe durch Zufächeln");
    await takeImportBonus(db, USER, offer?.tokenIds ?? []);
    expect(await getCard(db, items[0].tokenId, USER)).toBeDefined();
    expect(await listImportBonus(db, USER)).toEqual([]);

    // The same photo again: the review says when it came in before.
    const again = await reviewMaterialOnDevice(db, USER, analysis.set);
    expect(again.reimports).toHaveLength(1);
    expect(reimportText(again.reimports, "de")).toMatch(
      /^Diese Datei hast du am .+ schon importiert\.$/,
    );
  });

  it("sends photos over the native body limit in batches and keeps their numbers", async () => {
    const bodies: Array<{ images: number }> = [];
    const request: VisionRequestFn = async ({ body }) => {
      const parsed = JSON.parse(body);
      const images = parsed.messages[1].content.filter(
        (part: { type: string }) => part.type === "image_url",
      ).length;
      bodies.push({ images });
      // Each batch proposes one card about its own last photo.
      return answer([{ ...FIXTURE.proposals[0], file: images - 1 }]);
    };
    const big = "A".repeat(4_000_000);
    const analysis = await analyzeMaterialOnDevice(
      db,
      [photo("1.jpg", big), photo("2.jpg", big)],
      {
        endpoints: [
          {
            url: "https://openrouter.ai/api/v1",
            model: "vendor/luna",
            label: "Luna",
            readsPdf: false,
          },
        ],
        locale: "de",
        request,
      },
    );
    expect(bodies).toEqual([{ images: 1 }, { images: 1 }]);
    expect(analysis.set.proposals.map((p) => p.file)).toEqual([0, 1]);
  });

  it("links a photo by name and date, and fingerprints it with the WebView's crypto", async () => {
    expect(deviceSourceLink("Arbeitsblatt.pdf", new Date(2026, 0, 9))).toBe(
      "photo:Arbeitsblatt.pdf@2026-01-09",
    );
    expect(await sha256Hex(new TextEncoder().encode("abc").buffer)).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});
