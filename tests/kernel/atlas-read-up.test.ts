import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applySourceProposals,
  createToken,
  type Database,
  ensureCard,
  getTokenById,
  installKvtTile,
  LEBEN_LENS,
  MAX_LOOKUP_TERM,
  openDatabase,
  publishTokenRevision,
  readAtlas,
  readUpFor,
  readUpForTokens,
  recordTopicImport,
  WELTWISSEN_LENS,
  webSourceUrl,
} from "../../src/kernel/index.js";
import { listBundledTiles } from "../../src/kernel/library/bundled-cells.js";

/**
 * Reading up (ADR 2026-10-14, Decision 4): a world unit opens its web source
 * or a reference work's search for its lookup term; Firma and Privat units
 * get nothing; the term is a token field, part of its revision (M046).
 */

const USER = "learner";

describe("reading up", () => {
  it("opens only a page on the web, never a curriculum page or a credential", () => {
    expect(
      webSourceUrl("https://de.wikipedia.org/wiki/Brechung_(Physik)"),
    ).toBe("https://de.wikipedia.org/wiki/Brechung_(Physik)");
    expect(webSourceUrl("http://example.org/a")).toBe("http://example.org/a");
    for (const link of [
      null,
      "",
      "docs/okf/atlas.md",
      "file:///etc/passwd",
      "javascript:alert(1)",
      "https://user:secret@example.org/",
      "https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/9/physik",
      "not a url",
      // Never this machine or the local network (review round 2).
      "http://localhost:8080/admin",
      "http://app.localhost/",
      "http://127.0.0.1/",
      "http://192.168.1.10/wiki",
      "http://[::1]/",
      "http://intranet/wiki",
      "https://drucker.local/",
      "https://wiki.internal/a",
      "https://nas.home.arpa/",
    ]) {
      expect(webSourceUrl(link)).toBeNull();
    }
  });

  it("prefers the web source, then the lookup term, then the title", () => {
    expect(
      readUpFor({
        title: "Brechung",
        sourceLinks: [null, "https://example.org/brechung"],
        lookupTerms: ["Brechung (Physik)"],
        languages: [null],
      }),
    ).toEqual({ kind: "source", url: "https://example.org/brechung" });
    expect(
      readUpFor({
        title: "Brechung",
        sourceLinks: ["docs/notes.md"],
        lookupTerms: [null, " Brechung (Physik) "],
        languages: [null, "de"],
      }),
    ).toEqual({ kind: "search", term: "Brechung (Physik)", language: "de" });
    expect(
      readUpFor({
        title: "Brechung",
        sourceLinks: [],
        lookupTerms: [],
        languages: [],
      }),
    ).toEqual({ kind: "search", term: "Brechung", language: null });
    expect(
      readUpFor({
        title: " ",
        sourceLinks: [],
        lookupTerms: [],
        languages: [],
      }),
    ).toBeNull();
  });

  describe("on a library", () => {
    let dir: string;
    let db: Database;

    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-read-up-"));
      db = await openDatabase({
        dbPath: join(dir, "zam.db"),
        initialize: true,
        useConfiguredCloud: false,
      });
    });

    afterEach(async () => {
      await db.close();
      rmSync(dir, { recursive: true, force: true });
    });

    async function own(
      slug: string,
      domain: string,
      extra: { lookup_term?: string; source_link?: string } = {},
    ): Promise<string> {
      const token = await createToken(db, {
        slug,
        concept: `Was ${slug} bedeutet, in einem Satz erklärt.`,
        question: `Was bedeutet ${slug}?`,
        title: slug,
        domain,
        ...extra,
      });
      await ensureCard(db, token.id, USER);
      return token.id;
    }

    it("keeps a topic import's units on the world planet where nobody placed them", async () => {
      // A member of a team library may not place them (review round 2);
      // their source still makes them world knowledge.
      const id = await own("hebelgesetz", "github/werkzeuge", {
        lookup_term: "Hebelgesetz",
      });
      const before = await readUpForTokens(db, [id]);
      expect(before.get(id)).toBeUndefined();
      const { sourceId } = await recordTopicImport(db, {
        title: "Hebel",
        userId: USER,
      });
      await db
        .prepare(
          `INSERT INTO token_sources (token_id, source_id, excerpt, page_number)
           VALUES (?, ?, '', NULL)`,
        )
        .run(id, sourceId);
      expect((await readUpForTokens(db, [id])).get(id)).toMatchObject({
        kind: "search",
        term: "Hebelgesetz",
      });
    });

    it("stores the term trimmed and bounded, and lets a revision change it", async () => {
      const id = await own("brechung", "physik/optik", {
        lookup_term: `  Brechung   (Physik)  `,
      });
      expect((await getTokenById(db, id))?.lookup_term).toBe(
        "Brechung (Physik)",
      );
      const long = await own("lang", "physik/optik", {
        lookup_term: "x".repeat(500),
      });
      expect((await getTokenById(db, long))?.lookup_term).toHaveLength(
        MAX_LOOKUP_TERM,
      );
      await publishTokenRevision(db, {
        tokenId: id,
        materiality: "cosmetic",
        changes: { lookupTerm: "Lichtbrechung" },
      });
      expect((await getTokenById(db, id))?.lookup_term).toBe("Lichtbrechung");
      await publishTokenRevision(db, {
        tokenId: id,
        materiality: "cosmetic",
        changes: { lookupTerm: " " },
      });
      expect((await getTokenById(db, id))?.lookup_term).toBeNull();
    });

    it("gives world units a place to read up and private units none", async () => {
      const brechung = await own("brechung", "physik/optik", {
        lookup_term: "Brechung (Physik)",
      });
      const quelle = await own("quelle", "physik/optik", {
        source_link: "https://example.org/optik",
      });
      const familie = await own("geburtstage", "familie/geburtstage");
      const found = await readUpForTokens(db, [brechung, quelle, familie]);
      expect(found.get(brechung)).toEqual({
        kind: "search",
        term: "Brechung (Physik)",
        language: null,
      });
      expect(found.get(quelle)).toEqual({
        kind: "source",
        url: "https://example.org/optik",
      });
      expect(found.has(familie)).toBe(false);
      expect((await readUpForTokens(db, [])).size).toBe(0);
    });

    it("reads a published atom up by its title", async () => {
      const tile = listBundledTiles().find((t) =>
        t.atoms.some((a) => a.domain.startsWith("physik/optik")),
      );
      if (!tile) throw new Error("no bundled optics tile");
      await installKvtTile(db, tile);
      const row = (await db
        .prepare(
          `SELECT t.id, a.title FROM tokens t JOIN learning_atoms a ON a.id = t.atom_id
            WHERE t.source_link IS NULL OR t.source_link NOT LIKE 'http%' LIMIT 1`,
        )
        .get()) as { id: string; title: string } | undefined;
      if (!row) throw new Error("no atom token without a web source");
      const found = await readUpForTokens(db, [row.id]);
      expect(found.get(row.id)).toMatchObject({
        kind: "search",
        term: row.title,
      });
    });

    it("puts it on the world map only", async () => {
      await own("brechung", "physik/optik", {
        lookup_term: "Brechung (Physik)",
      });
      await own("geburtstage", "familie/geburtstage");
      const welt = await readAtlas(db, { userId: USER, lens: WELTWISSEN_LENS });
      expect(welt.units.map((u) => u.readUp)).toEqual([
        { kind: "search", term: "Brechung (Physik)", language: null },
      ]);
      const leben = await readAtlas(db, { userId: USER, lens: LEBEN_LENS });
      expect(leben.units).toHaveLength(1);
      expect(leben.units[0].readUp).toBeUndefined();
    });

    it("keeps a proposal's lookup term when an import creates its token", async () => {
      await db
        .prepare(
          "INSERT INTO sources (id, type, uri, created_at) VALUES ('s1', 'file', 'zam-topic:x', ?)",
        )
        .run(new Date().toISOString());
      const result = await applySourceProposals(db, USER, "s1", [
        {
          question: "Was ist ein JOIN?",
          concept: "Verknüpft Zeilen zweier Tabellen.",
          domain: "datenbanken/sql",
          bloom_level: 1,
          symbiosis_mode: "shadowing",
          excerpt: "",
          lookup_term: "Join (SQL)",
        },
      ]);
      const token = await getTokenById(db, result.items?.[0]?.tokenId ?? "");
      expect(token?.lookup_term).toBe("Join (SQL)");
    });
  });
});
