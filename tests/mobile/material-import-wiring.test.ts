import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { messageKeys } from "../../mobile/src/i18n.js";
import {
  bytesToBase64,
  deviceFileKind,
  devicePhotoBlob,
} from "../../mobile/src/image-import.js";
import { importBonusOffer } from "../../mobile/src/study-offers.js";

/** ADR 2026-10-05, Phase 8: the phone's way in, and its offer afterwards. */

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("mobile material import wiring", () => {
  it("takes several photos from camera or library, or one PDF", () => {
    const html = read("mobile/index.html");
    expect(html).toContain(
      '<input id="import-image" type="file" accept="image/*,application/pdf" multiple />',
    );
    for (const id of [
      "material-review",
      "material-review-list",
      "material-review-confirm",
      "material-review-cancel",
      "material-review-areas",
    ]) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it("reads files by MIME type first, as a camera names them loosely", () => {
    expect(deviceFileKind({ name: "image", type: "image/jpeg" })).toBe("image");
    expect(deviceFileKind({ name: "IMG_1.HEIC", type: "image/heic" })).toBe(
      "heic",
    );
    expect(deviceFileKind({ name: "blatt", type: "application/pdf" })).toBe(
      "pdf",
    );
    expect(deviceFileKind({ name: "notes.docx", type: "" })).toBe("other");
    expect(bytesToBase64(new TextEncoder().encode("Chemie"))).toBe("Q2hlbWll");
  });

  it("decodes a photo a Files picker typed as octet-stream, by its name", () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    const picked = (name: string, type: string) =>
      Object.assign(new Blob([bytes], { type }), { name });
    const generic = "application/octet-stream";
    expect(deviceFileKind(picked("notes.jpg", generic))).toBe("image");
    expect(
      devicePhotoBlob(picked("notes.jpg", generic), bytes, "image").type,
    ).toBe("image/jpeg");
    expect(
      devicePhotoBlob(picked("tafel.PNG", generic), bytes, "image").type,
    ).toBe("image/png");
    expect(
      devicePhotoBlob(picked("IMG_1.HEIC", generic), bytes, "heic").type,
    ).toBe("image/heic");
    expect(devicePhotoBlob(picked("blatt.webp", ""), bytes, "image").type).toBe(
      "image/webp",
    );
    // A photo the picker typed already goes as it is.
    const typed = picked("image", "image/jpeg");
    expect(devicePhotoBlob(typed, bytes, "image")).toBe(typed);
  });

  it("offers kept import items before the atom bonus, on both surfaces", () => {
    const main = read("mobile/src/main.ts");
    for (const name of [
      "async function offerBonusThenSummary",
      "async function renderDashboardBonus",
    ]) {
      const body = main.slice(main.indexOf(name));
      expect(body.indexOf("loadImportBonusOffer(userId)")).toBeGreaterThan(0);
      expect(body.indexOf("loadImportBonusOffer(userId)")).toBeLessThan(
        body.indexOf("loadBonusOffer("),
      );
    }
    expect(main).toContain("void runMaterialImport();");
    expect(main).not.toContain("decomposeImageViaVision");
    expect(
      importBonusOffer([
        { tokenId: "t1", title: "A", sourceId: "s1", sourceTitle: "Notizen" },
        { tokenId: "t2", title: "B", sourceId: "s0", sourceTitle: "Alt" },
      ]),
    ).toEqual({ sourceTitle: "Notizen", tokenIds: ["t1"], titles: ["A"] });
  });

  it("names every message in both languages", () => {
    for (const key of [
      "material_analyze",
      "material_no_file_model",
      "material_heic",
      "material_review_title",
      "material_existing",
      "import_bonus_body_many",
    ]) {
      expect(messageKeys("de")).toContain(key);
      expect(messageKeys("en")).toContain(key);
    }
  });
});
