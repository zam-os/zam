import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  confirmMobileImport,
  parseMobileImport,
} from "../../mobile/src/import.js";
import {
  createKnowledgeContext,
  createToken,
  type Database,
  getCard,
  getPrerequisites,
  getTokenBySlug,
  listContextsForToken,
  openDatabase,
} from "../../src/kernel/index.js";

describe("mobile additive import and quick capture", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-mobile-import-"));
    db = await openDatabase({
      dbPath: join(tempDir, "import.db"),
      initialize: true,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("parses the stable bridge-token JSON contract and CLI spellings", () => {
    expect(
      parseMobileImport(
        JSON.stringify({
          slug: "newton-two",
          title: "Newtons zweites Gesetz",
          concept: "Kraft ist Masse mal Beschleunigung.",
          domain: "physik",
          bloom_level: 2,
          source_link: "https://example.test/newton",
          question: "Wie hängen Kraft, Masse und Beschleunigung zusammen?",
          knowledge_contexts: ["schule"],
          prerequisites: ["kraft"],
        }),
      ),
    ).toEqual({
      origin: "bridge-json",
      slug: "newton-two",
      title: "Newtons zweites Gesetz",
      concept: "Kraft ist Masse mal Beschleunigung.",
      domain: "physik",
      bloomLevel: 2,
      context: undefined,
      symbiosisMode: undefined,
      source_link: "https://example.test/newton",
      question: "Wie hängen Kraft, Masse und Beschleunigung zusammen?",
      prerequisites: ["kraft"],
      knowledgeContexts: ["schule"],
    });
  });

  it("turns pasted text and URLs into editable quick-capture drafts", () => {
    expect(
      parseMobileImport("Trägheit beschreibt den Bewegungszustand."),
    ).toMatchObject({
      origin: "quick-capture",
      slug: "traegheit-beschreibt-den-bewegungszustand",
      title: "Trägheit beschreibt den Bewegungszustand.",
      concept: "Trägheit beschreibt den Bewegungszustand.",
      domain: "inbox",
      bloomLevel: 1,
      source_link: null,
    });
    expect(parseMobileImport("https://example.test/lesson")).toMatchObject({
      origin: "quick-capture",
      title: "example.test",
      concept: "https://example.test/lesson",
      source_link: "https://example.test/lesson",
    });
  });

  it("rejects malformed or oversized imports before showing a draft", () => {
    expect(() => parseMobileImport('{"slug":')).toThrow(
      "Bridge JSON is not valid JSON",
    );
    expect(() => parseMobileImport("x".repeat(256_001))).toThrow(
      "Import is larger than 256 KB",
    );
  });

  it("atomically imports a token, personal card, contexts, and prerequisites", async () => {
    const prerequisite = await createToken(db, {
      slug: "kraft",
      concept: "Kraft verändert Bewegung.",
    });
    await createKnowledgeContext(db, { name: "schule" });
    const draft = parseMobileImport(
      JSON.stringify({
        slug: "newton-two",
        concept: "F = m · a",
        domain: "physik",
        bloomLevel: 2,
        question: "Wie lautet Newton II?",
        knowledgeContexts: ["schule"],
        prerequisites: ["kraft"],
      }),
    );

    const result = await confirmMobileImport(db, "student-9", draft);

    expect(result.token).toMatchObject({
      slug: "newton-two",
      question_source: "llm",
    });
    expect(await getCard(db, result.token.id, "student-9")).toMatchObject({
      id: result.card.id,
      due_at: expect.any(String),
    });
    expect(await listContextsForToken(db, result.token.id)).toMatchObject([
      { name: "schule" },
    ]);
    expect(await getPrerequisites(db, result.token.id)).toMatchObject([
      { requires_id: prerequisite.id },
    ]);
  });

  it("rolls back the token and card when optional bridge references are invalid", async () => {
    const draft = parseMobileImport(
      JSON.stringify({
        slug: "rollback-import",
        concept: "Must not survive",
        domain: "test",
        bloomLevel: 1,
        knowledgeContexts: ["missing"],
      }),
    );

    await expect(confirmMobileImport(db, "student-9", draft)).rejects.toThrow(
      "Knowledge context not found: missing",
    );
    expect(await getTokenBySlug(db, "rollback-import")).toBeUndefined();
  });
});
