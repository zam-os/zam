import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  BASE_SHADE,
  CONDITION_TEXTURE,
  conditionFill,
  hslToRgb,
  hueFor,
  hueKeyForDomain,
  type Rgb,
  regionShade,
  rgbCss,
  SUBJECT_HUES,
} from "../../src/kernel/atlas/palette.js";
import {
  addPrerequisite,
  createToken,
  type Database,
  ensureCard,
  getTokenNeighborhood,
  openDatabase,
  updateCard,
} from "../../src/kernel/index.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Relative luminance-ish brightness, enough to compare two fills. */
function brightness([r, g, b]: Rgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Spread between the strongest and weakest channel: a saturation proxy. */
function chroma([r, g, b]: Rgb): number {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

describe("hue", () => {
  it("colours a domain by its subject, through the aliases", () => {
    expect(hueKeyForDomain("mathematik/geometrie/dreiecke")).toBe("mathematik");
    expect(hueKeyForDomain("schule/chemie/stoffe")).toBe("chemie");
    expect(hueKeyForDomain("bwr/bilanz")).toBe("wirtschaft-recht");
    expect(hueKeyForDomain("pug/lb3")).toBe("politik-und-gesellschaft");
    expect(hueKeyForDomain("nut/ernaehrung")).toBe("biologie");
    expect(hueKeyForDomain(" Physik/Mechanik ")).toBe("physik");
    expect(hueKeyForDomain("")).toBe("");
  });

  it("gives every subject its own hue and unknown keys a stable one", () => {
    expect(hueFor("mathematik")).toBe(SUBJECT_HUES.mathematik);
    const hues = Object.values(SUBJECT_HUES);
    expect(new Set(hues).size).toBe(hues.length);

    const unknown = hueFor("zam-architecture");
    expect(unknown).toBe(hueFor("zam-architecture"));
    expect(unknown).toBeGreaterThanOrEqual(0);
    expect(unknown).toBeLessThan(360);
  });
});

describe("conditionFill", () => {
  const hue = SUBJECT_HUES.mathematik;

  it("is most vivid when known and fades as knowledge decays", () => {
    const known = conditionFill(hue, "known", "light");
    const due = conditionFill(hue, "due", "light");
    const overdue = conditionFill(hue, "overdue", "light");
    const decaying = conditionFill(hue, "decaying", "light");
    expect(chroma(known)).toBeGreaterThan(chroma(due));
    expect(brightness(overdue)).toBeLessThan(brightness(known));
    expect(brightness(decaying)).toBeLessThan(brightness(overdue));
  });

  it("fogs forgotten knowledge and sketches the never practised on parchment", () => {
    const known = conditionFill(hue, "known", "light");
    const forgotten = conditionFill(hue, "forgotten", "light");
    const unpractised = conditionFill(hue, "unpractised", "light");
    const noCard = conditionFill(hue, null, "light");
    expect(chroma(forgotten)).toBeLessThan(chroma(known) / 2);
    expect(brightness(unpractised)).toBeGreaterThan(brightness(known));
    // Without a card the hue is barely there, less than when practised never.
    expect(chroma(noCard)).toBeLessThan(chroma(unpractised));
  });

  it("is darker in the dark theme", () => {
    expect(brightness(conditionFill(hue, "known", "dark"))).toBeLessThan(
      brightness(conditionFill(hue, "known", "light")),
    );
  });

  it("repeats every condition as a texture except plain knowledge", () => {
    expect(CONDITION_TEXTURE.known).toBe("none");
    for (const condition of [
      "due",
      "overdue",
      "decaying",
      "forgotten",
      "unpractised",
    ] as const) {
      expect(CONDITION_TEXTURE[condition]).not.toBe("none");
    }
  });

  it("shades sibling regions apart and keeps the plain shade as default", () => {
    expect(conditionFill(hue, "known", "light", BASE_SHADE)).toEqual(
      conditionFill(hue, "known", "light"),
    );
    expect(regionShade(0, null)).toEqual(BASE_SHADE);
    const first = conditionFill(hue, "known", "light", regionShade(0, null));
    const second = conditionFill(hue, "known", "light", regionShade(1, null));
    expect(second).not.toEqual(first);
    // Wraps instead of running out of shades.
    expect(regionShade(8, null)).toEqual(regionShade(0, null));
    // A leaf below the shade differs a little from its sibling leaf.
    expect(regionShade(2, 0)).not.toEqual(regionShade(2, 1));
    // The condition still decides how vivid a shaded region is.
    const shade = regionShade(3, 1);
    expect(chroma(conditionFill(hue, "known", "light", shade))).toBeGreaterThan(
      chroma(conditionFill(hue, "forgotten", "light", shade)),
    );
  });

  it("converts HSL and formats CSS", () => {
    expect(hslToRgb(0, 100, 50).map(Math.round)).toEqual([255, 0, 0]);
    expect(hslToRgb(120, 100, 25).map(Math.round)).toEqual([0, 128, 0]);
    expect(hslToRgb(-120, 100, 50).map(Math.round)).toEqual([0, 0, 255]);
    expect(rgbCss([10.4, 20.6, 30])).toBe("rgb(10, 21, 30)");
    expect(rgbCss([10, 20, 30], 0.5)).toBe("rgba(10, 20, 30, 0.5)");
  });
});

describe("getTokenNeighborhood colour fields", () => {
  let db: Database;
  let tempDir: string;
  const now = new Date("2026-10-13T12:00:00.000Z");

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-atlas-palette-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("gives every node its hue key and the user's condition", async () => {
    const center = await createToken(db, {
      slug: "satz-des-pythagoras",
      concept: "a² + b² = c² im rechtwinkligen Dreieck",
      domain: "mathematik/geometrie",
      bloom_level: 2,
    });
    const basis = await createToken(db, {
      slug: "quadratzahlen",
      concept: "Eine Zahl mit sich selbst multipliziert",
      domain: "mathematik/zahlen",
      bloom_level: 1,
    });
    const next = await createToken(db, {
      slug: "abstand-im-koordinatensystem",
      concept: "Abstand zweier Punkte",
      domain: "bwr/beispiel",
      bloom_level: 3,
    });
    await addPrerequisite(db, center.id, basis.id);
    await addPrerequisite(db, next.id, center.id);

    const userId = "learner-1";
    const centerCard = await ensureCard(db, center.id, userId);
    await updateCard(db, centerCard.id, {
      state: "review",
      stability: 20,
      lapses: 0,
      due_at: new Date(now.getTime() + 5 * DAY_MS).toISOString(),
      last_review_at: new Date(now.getTime() - 3 * DAY_MS).toISOString(),
    });
    await ensureCard(db, basis.id, userId); // new: never practised

    const nb = await getTokenNeighborhood(db, center.id, userId, now);
    expect(nb.center.hue_key).toBe("mathematik");
    expect(nb.center.condition).toBe("known");
    expect(nb.center.card?.lapses).toBe(0);

    expect(nb.prerequisites[0].hue_key).toBe("mathematik");
    expect(nb.prerequisites[0].condition).toBe("unpractised");

    expect(nb.dependents[0].hue_key).toBe("wirtschaft-recht");
    expect(nb.dependents[0].condition).toBeNull();
  });

  it("has no condition without a user", async () => {
    const token = await createToken(db, {
      slug: "zellatmung",
      concept: "Energiegewinnung in der Zelle",
      domain: "biologie/zelle",
      bloom_level: 2,
    });
    const nb = await getTokenNeighborhood(db, token.id, undefined, now);
    expect(nb.center.hue_key).toBe("biologie");
    expect(nb.center.condition).toBeNull();
  });
});
