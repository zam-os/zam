import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearPersonalEmblem,
  clearSharedEmblem,
  createToken,
  type Database,
  EMBLEM_MAX_CHARS,
  EMBLEM_VALIDATOR_VERSION,
  emblemDataUrl,
  glyphEmblemSvg,
  openDatabase,
  readAtlas,
  regionEmblemKey,
  installKvtTile,
  resolveEmblem,
  revalidateEmblems,
  SCHULE_LENS,
  seedEmblem,
  seedEmblems,
  setEmblem,
  validateEmblem,
  WELTWISSEN_LENS,
  WELTWISSEN_SEED,
} from "../../src/kernel/index.js";
import {
  applySchemaAndMigrations,
  CURRENT_SCHEMA_VERSION,
} from "../../src/kernel/db/provision.js";
import { listBundledTiles } from "../../src/kernel/library/bundled-cells.js";
import { materialiseKvtCards } from "../../src/kernel/library/kvt-attach.js";

const NS = 'xmlns="http://www.w3.org/2000/svg"';
const svg = (body: string, root = 'viewBox="0 0 64 64"') =>
  `<svg ${NS} ${root}>${body}</svg>`;
const CIRCLE = svg('<circle cx="32" cy="32" r="20" fill="#2f6fdf"/>');

function rejects(input: string, glyph?: string): string {
  const result = validateEmblem(input, glyph);
  expect(result.ok, input).toBe(false);
  return result.ok ? "" : result.error;
}

describe("Sinnbild validator (ADR 2026-10-13, Decision 6)", () => {
  it("accepts plain shapes and text, and every seed Sinnbild", () => {
    const ok = validateEmblem(
      svg(
        '<g opacity="0.8"><path d="M4 50 L22 24 Z" fill="none" stroke="#1d2b4f" stroke-width="3"/>' +
          '<ellipse cx="32" cy="32" rx="9" ry="4" transform="rotate(30 32 32)"/>' +
          '<polygon points="1,2 3,4 5,6"/><polyline points="1 2 3 4"/>' +
          '<rect x="1" y="1" width="10" height="10" rx="2"/><line x1="0" y1="0" x2="5" y2="5"/></g>' +
          '<text x="32" y="40" font-size="20" text-anchor="middle">a² <tspan font-weight="700">+ b²</tspan></text>',
      ),
      "a² + b² = c²",
    );
    expect(ok.ok).toBe(true);
    const entries = seedEmblems();
    expect(entries.length).toBeGreaterThan(70);
    for (const [key, seed] of entries) {
      const result = validateEmblem(seed.svg, seed.glyph);
      expect(result.ok, `${key}: ${result.ok ? "" : result.error}`).toBe(true);
    }
  });

  it("has a seed Sinnbild for every Bereich, Fach and Gebiet of the Weltwissen seed", () => {
    for (const bereich of WELTWISSEN_SEED) {
      expect(seedEmblem("weltwissen", bereich.key), bereich.key).toBeDefined();
      for (const subject of bereich.subjects) {
        const fach = `${bereich.key}.${subject.key}`;
        expect(seedEmblem("weltwissen", fach), fach).toBeDefined();
        for (const area of subject.areas) {
          const gebiet = `${fach}.${area.key}`;
          expect(seedEmblem("weltwissen", gebiet), gebiet).toBeDefined();
        }
      }
    }
    expect(seedEmblem("schule", "rs-9")?.glyph).toBe("9.");
    expect(seedEmblem("schule", "rs-9.mathematik")).toEqual(
      seedEmblem("weltwissen", "logik.mathematik"),
    );
    expect(seedEmblem("schule", "rs-9.mathematik.terme")).toBeUndefined();
  });

  it("rejects scripts, styles, links, images, foreign content and animation", () => {
    rejects(svg("<script>alert(1)</script>"));
    rejects(svg('<circle cx="1" cy="1" r="1" onload="alert(1)"/>'));
    rejects(svg('<circle cx="1" cy="1" r="1" onclick="x"/>'));
    rejects(svg("<style>circle{fill:red}</style>"));
    rejects(svg('<circle cx="1" cy="1" r="1" style="fill:red"/>'));
    rejects(svg('<a href="https://example.com"><circle cx="1" cy="1" r="1"/></a>'));
    rejects(svg('<circle cx="1" cy="1" r="1" href="#x"/>'));
    rejects(svg('<circle cx="1" cy="1" r="1" xlink:href="#x"/>'));
    rejects(svg('<image href="x.png" width="10" height="10"/>'));
    rejects(svg("<foreignObject><div>hi</div></foreignObject>"));
    rejects(svg('<use href="#a"/>'));
    rejects(svg('<animate attributeName="r" values="1;2"/>'));
    rejects(svg('<set attributeName="fill" to="red"/>'));
    rejects(svg('<g onmouseover="x"><circle cx="1" cy="1" r="1"/></g>'));
  });

  it("rejects entities, url(), data:, javascript: and a wrong viewBox", () => {
    rejects(`<!DOCTYPE svg [<!ENTITY x "y">]>${CIRCLE}`);
    rejects(svg("<text>&x;</text>"));
    rejects(svg("<text>&#60;script&#62;</text>"));
    rejects(svg("<!-- note --><circle cx='1' cy='1' r='1'/>"));
    rejects(svg("<text><![CDATA[x]]></text>"));
    rejects(svg('<circle cx="1" cy="1" r="1" fill="url(#g)"/>'));
    rejects(svg('<circle cx="1" cy="1" r="1" fill="url (#g)"/>'));
    rejects(svg('<circle cx="1" cy="1" r="1" fill="data:x"/>'));
    rejects(svg('<circle cx="1" cy="1" r="1" fill="javascript:x"/>'));
    rejects(`<svg ${NS}><circle cx="1" cy="1" r="1"/></svg>`);
    rejects(svg('<circle cx="1" cy="1" r="1"/>', 'viewBox="0 0 100 100"'));
    rejects(svg('<circle cx="1" cy="1" r="1"/>', 'viewBox="0 0 64 64" width="500"'));
    rejects(`<svg xmlns="http://evil.example" viewBox="0 0 64 64"/>`);
    rejects(`<g>${CIRCLE}</g>`);
    rejects(`${CIRCLE}${CIRCLE}`);
    rejects(svg("stray text"));
    rejects(svg("<circle cx=1 cy=1 r=1/>"));
    rejects(svg('<circle cx="1" cx="2" cy="1" r="1"/>'));
    rejects(svg("<g><circle/>"));
  });

  it("limits the size, and the glyph to plain text of 16 characters", () => {
    const big = svg(`<path d="${"M1 1 ".repeat(1300)}"/>`);
    expect(big.length).toBeGreaterThan(EMBLEM_MAX_CHARS);
    expect(rejects(big)).toContain(String(EMBLEM_MAX_CHARS));
    rejects(CIRCLE, "<b>x</b>");
    rejects(CIRCLE, "x".repeat(17));
    expect(validateEmblem(CIRCLE, "a² + b² = c²").ok).toBe(true);
  });

  it("stores the canonical form: fixed order, escaped text, idempotent", () => {
    const messy = `<?xml version="1.0"?>\n<svg viewBox="0,0,64,64"   ${NS}>\n  <circle r="20" fill="#2f6fdf" cy="32" cx="32" />\n  <text x="1" y="9">1 &lt; 2   &amp;  3</text>\n</svg>`;
    const tidy = svg(
      '<circle cx="32" cy="32" r="20" fill="#2f6fdf"/><text x="1" y="9">1 &lt; 2 &amp; 3</text>',
    );
    const a = validateEmblem(messy);
    const b = validateEmblem(tidy);
    if (!a.ok || !b.ok) throw new Error("expected both to pass");
    expect(a.canonical).toBe(b.canonical);
    expect(a.canonical).not.toBe(messy);
    const again = validateEmblem(a.canonical);
    expect(again.ok && again.canonical).toBe(a.canonical);
  });

  it("turns a glyph into a Sinnbild and a canonical form into an image URL", () => {
    const glyph = validateEmblem(glyphEmblemSvg("π"), "π");
    expect(glyph.ok).toBe(true);
    const tricky = validateEmblem(glyphEmblemSvg("a&b"), "a&b");
    expect(tricky.ok && tricky.canonical).toContain("a&amp;b");
    const url = emblemDataUrl(svg("<text>ä</text>"));
    expect(url.startsWith("data:image/svg+xml;base64,")).toBe(true);
    const decoded = new TextDecoder().decode(
      Uint8Array.from(atob(url.split(",")[1]), (c) => c.charCodeAt(0)),
    );
    expect(decoded).toContain("ä");
  });
});

describe("storing and resolving Sinnbilder", () => {
  let dir: string;
  let db: Database;
  let tokenKey: string;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-emblems-"));
    db = await openDatabase({
      dbPath: join(dir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    const token = await createToken(db, {
      slug: "lichtbrechung",
      concept: "Lichtbrechung",
      domain: "physik/optik",
    });
    tokenKey = `token:${token.id}`;
  });

  afterEach(async () => {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("writes the first shared with the right, then personal; the personal one wins", async () => {
    const first = await setEmblem(db, {
      subjectKey: tokenKey,
      svg: `  ${CIRCLE}  `,
      userId: "anna",
      mayWriteKnowledge: true,
    });
    expect(first.scope).toBe("shared");
    const stored = (await db
      .prepare("SELECT svg, validator_version FROM emblems WHERE subject_key = ?")
      .get(tokenKey)) as { svg: string; validator_version: number };
    expect(stored.svg).toBe(first.svg);
    expect(stored.svg).not.toBe(`  ${CIRCLE}  `);
    expect(stored.validator_version).toBe(EMBLEM_VALIDATOR_VERSION);

    // The second, even with the right, is the writer's own.
    const second = await setEmblem(db, {
      subjectKey: tokenKey,
      glyph: "n₁",
      userId: "ben",
      mayWriteKnowledge: true,
    });
    expect(second.scope).toBe("personal");
    expect((await resolveEmblem(db, tokenKey, "ben"))?.source).toBe("personal");
    expect((await resolveEmblem(db, tokenKey, "ben"))?.glyph).toBe("n₁");
    expect((await resolveEmblem(db, tokenKey, "anna"))?.source).toBe("shared");

    expect(await clearPersonalEmblem(db, "ben", tokenKey)).toBe(true);
    expect((await resolveEmblem(db, tokenKey, "ben"))?.source).toBe("shared");
  });

  it("writes personal without the right, and refuses shared", async () => {
    const own = await setEmblem(db, {
      subjectKey: tokenKey,
      svg: CIRCLE,
      userId: "carla",
      mayWriteKnowledge: false,
    });
    expect(own.scope).toBe("personal");
    await expect(
      setEmblem(db, {
        subjectKey: tokenKey,
        svg: CIRCLE,
        userId: "carla",
        mayWriteKnowledge: false,
        scope: "shared",
      }),
    ).rejects.toMatchObject({ code: "not-curator" });
    await expect(clearSharedEmblem(db, tokenKey, false)).rejects.toMatchObject({
      code: "not-curator",
    });
  });

  it("refuses an invalid SVG, an unknown unit and a malformed region key", async () => {
    const base = { userId: "anna", mayWriteKnowledge: true };
    await expect(
      setEmblem(db, { ...base, subjectKey: tokenKey, svg: svg("<script/>") }),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      setEmblem(db, { ...base, subjectKey: "token:nope", svg: CIRCLE }),
    ).rejects.toMatchObject({ code: "unknown-subject" });
    await expect(
      setEmblem(db, { ...base, subjectKey: "region:zoo:x", svg: CIRCLE }),
    ).rejects.toMatchObject({ code: "unknown-subject" });
    await expect(
      setEmblem(db, { ...base, subjectKey: tokenKey }),
    ).rejects.toMatchObject({ code: "missing" });
    const region = await setEmblem(db, {
      ...base,
      subjectKey: regionEmblemKey("weltwissen", "natur.physik.optik.linsen"),
      svg: CIRCLE,
    });
    expect(region.scope).toBe("shared");
  });

  it("falls back to the seed for a region, and drops rows that fail newer rules", async () => {
    const optik = regionEmblemKey("weltwissen", "natur.physik.optik");
    expect((await resolveEmblem(db, optik, "anna"))?.source).toBe("seed");

    // A row an older validator let through, which today's rules refuse.
    await db
      .prepare(
        `INSERT INTO learner_emblems (user_id, subject_key, svg, validator_version, glyph, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run("anna", optik, svg('<use href="#x"/>'), 0, null, "2026-01-01");
    await db
      .prepare(
        `INSERT INTO emblems (subject_key, svg, validator_version, glyph, author, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(tokenKey, `${CIRCLE} `, 0, null, "agent", "2026-01-01");
    // Not shown even before the re-check.
    expect((await resolveEmblem(db, optik, "anna"))?.source).toBe("seed");
    const result = await revalidateEmblems(db, { userId: "anna", shared: true });
    expect(result).toEqual({ checked: 2, rewritten: 1, dropped: 1 });
    const rows = (await db
      .prepare("SELECT COUNT(*) AS n FROM learner_emblems")
      .get()) as { n: number };
    expect(Number(rows.n)).toBe(0);
    const kept = (await db
      .prepare("SELECT svg, validator_version FROM emblems WHERE subject_key = ?")
      .get(tokenKey)) as { svg: string; validator_version: number };
    expect(kept.validator_version).toBe(EMBLEM_VALIDATOR_VERSION);
    expect(kept.svg).toBe((validateEmblem(CIRCLE) as { canonical: string }).canonical);
  });

  it("shares a Fach's Sinnbild across lenses, under its subject", async () => {
    const tile = listBundledTiles().find((t) =>
      t.atoms.some((a) => a.domain.startsWith("physik/optik")),
    );
    if (!tile) throw new Error("no bundled optics tile");
    await installKvtTile(db, tile);
    await materialiseKvtCards(
      db,
      "anna",
      tile.atoms.map((a) => a.id),
    );
    const welt = await readAtlas(db, { userId: "anna", lens: WELTWISSEN_LENS });
    const physik = welt.regions.find((r) => r.key === "natur.physik");
    expect(physik?.emblemSubject).toBe("subject:physik");
    // Without its own, the Fach shows the seed's, through the subject.
    expect(welt.emblems[physik?.emblem ?? ""]?.source).toBe("seed");

    // Drawn in the Schule lens …
    const schule = await readAtlas(db, { userId: "anna", lens: SCHULE_LENS });
    const fach = schule.regions.find(
      (r) => r.level === 1 && r.hueKey === "physik",
    );
    expect(fach?.emblemSubject).toBe("subject:physik");
    await setEmblem(db, {
      subjectKey: fach?.emblemSubject ?? "",
      glyph: "F = m·a",
      userId: "anna",
      mayWriteKnowledge: true,
    });
    // … it is Weltwissen's Physik too.
    const again = await readAtlas(db, { userId: "anna", lens: WELTWISSEN_LENS });
    const shown = again.regions.find((r) => r.key === "natur.physik");
    expect(again.emblems[shown?.emblem ?? ""]?.glyph).toBe("F = m·a");
    // A Gebiet stays its lens's own.
    const optik = again.regions.find((r) => r.key === "natur.physik.optik");
    expect(optik?.emblemSubject).toBe("region:weltwissen:natur.physik.optik");
  });

  it("moves a Fach's Sinnbild from a lens's region key to its subject (M044)", async () => {
    await db
      .prepare(
        `INSERT INTO learner_emblems (user_id, subject_key, svg, validator_version, glyph, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run("anna", "region:schule:ausserhalb.github", CIRCLE, 1, "gh", "2026-10-13");
    await db
      .prepare(
        `INSERT INTO emblems (subject_key, svg, validator_version, glyph, author, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run("region:weltwissen:natur.physik.optik", CIRCLE, 1, null, "agent", "2026-10-13");
    await db
      .prepare("UPDATE zam_schema_version SET version = ?")
      .run(CURRENT_SCHEMA_VERSION - 1);
    await applySchemaAndMigrations(db);
    const keys = (await db
      .prepare(
        "SELECT subject_key FROM learner_emblems UNION ALL SELECT subject_key FROM emblems ORDER BY 1",
      )
      .all()) as Array<{ subject_key: string }>;
    // The Fach moved; the Gebiet stayed where it was.
    expect(keys.map((k) => k.subject_key)).toEqual([
      "region:weltwissen:natur.physik.optik",
      "subject:github",
    ]);
  });

  it("gives the atlas each Sinnbild once, with a leaf region showing its first unit's", async () => {
    await setEmblem(db, {
      subjectKey: tokenKey,
      glyph: "n",
      userId: "anna",
      mayWriteKnowledge: true,
    });
    const view = await readAtlas(db, {
      userId: "anna",
      lens: WELTWISSEN_LENS,
      showNew: true,
    });
    const unit = view.units.find((u) => u.key === tokenKey);
    expect(unit?.emblem).toBe(tokenKey);
    expect(view.emblems[tokenKey]?.glyph).toBe("n");
    const optik = view.regions.find((r) => r.key === "natur.physik.optik");
    expect(optik?.emblem).toBe(regionEmblemKey("weltwissen", "natur.physik.optik"));
    expect(view.emblems[optik?.emblem ?? ""]?.source).toBe("seed");
    // The unit's leaf below Optik has no seed Sinnbild: it shows the unit's.
    const leaf = view.regions.find((r) => r.key === unit?.region);
    if (leaf && leaf.key !== "natur.physik.optik") {
      expect(leaf.emblem).toBe(tokenKey);
    }
  });
});
