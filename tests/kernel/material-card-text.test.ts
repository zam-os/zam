import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  commitMaterialImport,
  type Database,
  type MaterialProposalSet,
  MaterialProposalSetError,
  matchMaterialProposals,
  materialFormulasWithoutSpeech,
  materialSpeechIssues,
  openDatabase,
  parseMaterialProposalSet,
  withMaterialSpeech,
} from "../../src/kernel/index.js";

/**
 * Card text in a material import (ADR 2026-10-14b, Decision 6): a proposal
 * may hold a formula as `$…$` in a string or as segments; the learner's
 * import never fails over one. Synthetic cards written for this test.
 */

const FIXTURE = JSON.parse(
  readFileSync(
    join(__dirname, "../fixtures/material-import/chemie-sinne.json"),
    "utf8",
  ),
) as Record<string, unknown>;

function card(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    question: "Welche Dichte hat Wasser?",
    answer: "Ein Gramm pro Kubikzentimeter.",
    bloom: 1,
    file: 0,
    page: 1,
    area: "chemie/stoffe-und-eigenschaften",
    origin: "page",
    ...overrides,
  };
}

function setOf(
  entries: Record<string, unknown>[],
  mode?: "agent" | "import",
): MaterialProposalSet {
  const raw = structuredClone(FIXTURE);
  raw.proposals = entries;
  return parseMaterialProposalSet(raw, mode ? { mode } : {});
}

const DENSITY = [
  {
    type: "math",
    tex: "\\rho = 1\\,\\frac{\\text{g}}{\\text{cm}^3}",
    speech: "Rho gleich 1 Gramm pro Kubikzentimeter",
  },
];

describe("material proposals as card text", () => {
  it("lifts a formula a model wrote with dollars, without failing the set", () => {
    const set = setOf([card({ answer: "Es gilt $\\rho = m/V$." })]);
    const [proposal] = set.proposals;
    expect(proposal.answerSegments).toEqual([
      { type: "text", text: "Es gilt " },
      { type: "math", tex: "\\rho = m/V" },
      { type: "text", text: "." },
    ]);
    expect(proposal.answer).toBe("Es gilt ρ = m/V.");
    expect(materialFormulasWithoutSpeech(set)).toEqual(["\\rho = m/V"]);
  });

  it("keeps a dollar that is not math as text and notes it for the review", () => {
    const set = setOf([
      card({
        question: "Wofür steht $HOME in der Shell?",
        answer: "Das Heimatverzeichnis.",
      }),
    ]);
    const [proposal] = set.proposals;
    expect(proposal.question).toBe("Wofür steht $HOME in der Shell?");
    expect(proposal.questionSegments).toBeUndefined();
    expect(proposal.textNotes).toEqual([
      { kind: "dollar", text: "$HOME in der Shell?" },
    ]);
  });

  it("accepts segments with speech and keeps them as sent", () => {
    const set = setOf([card({ answer: DENSITY })], "agent");
    expect(set.proposals[0].answerSegments).toEqual(DENSITY);
    expect(set.proposals[0].answer).toBe("ρ = 1 g/(cm³)");
    expect(materialSpeechIssues(set)).toEqual([]);
  });

  it("names a refused formula for an agent, keeps it as text in an import", () => {
    const bad = card({ answer: "Siehe $\\href{x}{y}$." });
    try {
      setOf([bad], "agent");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(MaterialProposalSetError);
      expect((error as MaterialProposalSetError).issues[0]).toMatch(
        /^proposals\[0\]\.answer\[1\]\.tex: /,
      );
    }
    const set = setOf([bad]);
    expect(set.proposals[0].answer).toBe("Siehe href x y.");
    expect(set.proposals[0].textNotes).toEqual([
      { kind: "formula", text: "\\href{x}{y}" },
    ]);
  });

  it("lists formulas without speech, and fills them from a reading list", () => {
    const set = setOf([card({ answer: "Es gilt $\\rho = m/V$." })]);
    expect(materialSpeechIssues(set)).toEqual([
      'proposals[0].answer[1].speech: required — how "\\rho = m/V" is read aloud',
    ]);
    const filled = withMaterialSpeech(
      set,
      new Map([["\\rho = m/V", "Rho gleich m durch V"]]),
    );
    expect(materialSpeechIssues(filled)).toEqual([]);
  });

  it("parses its own output to the same set, as a staged batch is read back", () => {
    const set = setOf([
      card({ answer: "Es gilt $\\rho = m/V$." }),
      card({ question: "Wofür steht $HOME?", answer: DENSITY }),
    ]);
    const again = parseMaterialProposalSet(JSON.parse(JSON.stringify(set)));
    expect(again).toEqual(set);
  });
});

describe("committing a proposal with formulas", () => {
  let tempDir: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-material-card-text-"));
    db = await openDatabase({ dbPath: join(tempDir, "material.db") });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("stores the segments through the one write path", async () => {
    const set = setOf([card({ answer: DENSITY })], "agent");
    const rows = await matchMaterialProposals(db, "learner", set);
    const proposalRow = rows.find((row) => row.kind === "proposal");
    if (!proposalRow) throw new Error("no proposal row");
    await commitMaterialImport(db, "learner", {
      set,
      rows,
      decisions: { [proposalRow.id]: "yes" },
    });
    const token = (await db
      .prepare(
        "SELECT concept, concept_segments, question_segments FROM tokens WHERE question = ?",
      )
      .get("Welche Dichte hat Wasser?")) as {
      concept: string;
      concept_segments: string | null;
      question_segments: string | null;
    };
    expect(JSON.parse(token.concept_segments ?? "null")).toEqual(DENSITY);
    expect(token.concept).toBe("ρ = 1 g/(cm³)");
    expect(token.question_segments).toBeNull();
  });
});
