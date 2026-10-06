import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  batchByBudget,
  buildMaterialInstructions,
  buildMaterialRequest,
  MATERIAL_CARD_RULES,
  MATERIAL_MAX_OUTPUT_TOKENS,
  type MaterialAttachment,
  materialCardRules,
  materialSelectionOfKinds,
  mergeMaterialReplies,
  parseMaterialReply,
} from "../../src/cli/llm/material-prompt.js";

/** ADR 2026-10-05 Decisions 1, 3, 10: the built-in path's one request. */

const photo: MaterialAttachment = {
  name: "IMG_1.jpg",
  kind: "image",
  mime: "image/jpeg",
  base64: "AAAA",
};
const pdf: MaterialAttachment = {
  name: "Arbeitsblatt.pdf",
  kind: "pdf",
  mime: "application/pdf",
  base64: "JVBE",
};

describe("material instructions", () => {
  it("tells a single request it cannot ask back, and names areas and pages", () => {
    const text = buildMaterialInstructions({
      locale: "de-DE",
      areas: ["chemie/stoffe"],
      subjects: ["chemie", "physik"],
      pages: "2-3",
    });
    expect(text).toContain("You cannot ask back in this request");
    expect(text).not.toContain("zam_material_import_context");
    expect(text).toContain("Subject codes: chemie, physik");
    expect(text).toContain(
      "Areas already in the learner's library: chemie/stoffe",
    );
    expect(text).toContain("Use only these pages of the PDF: 2-3.");
    expect(text).toContain("The learner reads ZAM in German");
    expect(text).toContain("you return no files[]");
    expect(text).not.toContain("/Users/learner");
  });

  it("keeps the harness rules for the MCP context tool", () => {
    expect(MATERIAL_CARD_RULES).toEqual(materialCardRules("harness"));
    expect(MATERIAL_CARD_RULES[1]).toMatch(
      /^Before you propose, ask the learner/,
    );
  });
});

describe("buildMaterialRequest", () => {
  it("sends photos as image_url parts on chat completions", () => {
    const request = buildMaterialRequest(
      "chat-completions",
      { model: "openai/gpt-6-luna", readsPdf: false },
      { instructions: "RULES", attachments: [photo] },
    );
    expect(request).toEqual({
      path: "chat/completions",
      body: {
        model: "openai/gpt-6-luna",
        messages: [
          { role: "system", content: "RULES" },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: "data:image/jpeg;base64,AAAA" },
              },
              {
                type: "text",
                text: "Attachments, in order:\n0: IMG_1.jpg (photo)",
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: MATERIAL_MAX_OUTPUT_TOKENS,
      },
    });
  });

  it("sends a PDF as a file part, and on OpenRouter pins the native engine", () => {
    const request = buildMaterialRequest(
      "chat-completions",
      { model: "openai/gpt-6-luna", readsPdf: true },
      { instructions: "RULES", attachments: [pdf], openRouter: true },
    );
    const user = (request.body.messages as Array<{ content: unknown[] }>)[1];
    expect(user.content[0]).toEqual({
      type: "file",
      file: {
        filename: "Arbeitsblatt.pdf",
        file_data: "data:application/pdf;base64,JVBE",
      },
    });
    expect(request.body.response_format).toEqual({ type: "json_object" });
    expect(request.body.plugins).toEqual([
      { id: "file-parser", pdf: { engine: "native" } },
    ]);
  });

  it("uses image and document blocks on the Messages API", () => {
    const request = buildMaterialRequest(
      "anthropic-messages",
      { model: "claude-haiku-4-5", readsPdf: true },
      { instructions: "RULES", attachments: [pdf] },
    );
    expect(request.path).toBe("messages");
    expect(request.body).toMatchObject({
      model: "claude-haiku-4-5",
      system: "RULES",
      max_tokens: MATERIAL_MAX_OUTPUT_TOKENS,
    });
    const content = (
      request.body.messages as Array<{ content: Array<{ type: string }> }>
    )[0].content;
    expect(content[0]).toEqual({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: "JVBE" },
    });
    expect(
      buildMaterialRequest(
        "anthropic-messages",
        { model: "claude-haiku-4-5", readsPdf: true },
        { instructions: "RULES", attachments: [photo] },
      ).body.messages,
    ).toMatchObject([
      {
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: "AAAA" },
          },
          { type: "text" },
        ],
      },
    ]);
  });

  it("refuses a PDF for a row without the file capability", () => {
    for (const flavor of ["chat-completions", "anthropic-messages"] as const) {
      expect(() =>
        buildMaterialRequest(
          flavor,
          { model: "some/vision-model", readsPdf: false },
          { instructions: "RULES", attachments: [photo, pdf] },
        ),
      ).toThrow(/does not read PDFs itself/);
    }
  });
});

describe("reading the reply", () => {
  it("reads a fenced or prose-wrapped JSON object", () => {
    expect(
      parseMaterialReply(
        'Here you go:\n```json\n{"analysis":{"title":"x"},"proposals":[{"question":"q"}]}\n```',
      ),
    ).toEqual({ analysis: { title: "x" }, proposals: [{ question: "q" }] });
    expect(
      parseMaterialReply('Sure! {"analysis":{},"proposals":[]} Done.'),
    ).toEqual({ analysis: {}, proposals: [] });
    expect(() => parseMaterialReply("no json here")).toThrow(/JSON object/);
    expect(() => parseMaterialReply("[1, 2]")).toThrow(/JSON object/);
  });

  it("maps each batch's file numbers back to the import's", () => {
    const merged = mergeMaterialReplies([
      {
        reply: {
          analysis: { title: "first" },
          proposals: [{ question: "a", file: 1 }],
        },
        fileIndexes: [0, 1],
      },
      {
        reply: {
          analysis: { title: "second" },
          proposals: [
            { question: "b", file: 0 },
            { question: "c", file: 3 },
            { question: "d" },
          ],
        },
        fileIndexes: [2, 3],
      },
    ]);
    expect(merged.analysis).toEqual({ title: "first" });
    expect(merged.proposals).toEqual([
      { question: "a", file: 1 },
      { question: "b", file: 2 },
      // 3 is outside its batch of two, though inside the import: it must not
      // land on the import's photo 3, so validation rejects it.
      { question: "c", file: -1 },
      // No number means the batch's first file, as in one request.
      { question: "d", file: 2 },
    ]);
  });

  it("batches attachments under a body budget, in order", () => {
    const sized = (n: number) => ({ base64: "A".repeat(n) });
    expect(batchByBudget([sized(4), sized(4), sized(3), sized(9)], 8)).toEqual([
      [0, 1],
      [2],
      [3],
    ]);
    expect(batchByBudget([], 8)).toEqual([]);
  });

  it("applies the selection rule to kinds a phone already knows", () => {
    expect(materialSelectionOfKinds(["image", "heic"])).toEqual({
      ok: true,
      kind: "image",
    });
    expect(materialSelectionOfKinds(["pdf", "image"])).toMatchObject({
      code: "mixed",
    });
  });

  it("stays free of Node built-ins, for Mobile's bundle", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "cli", "llm", "material-prompt.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/from "node:/);
    expect(source).not.toContain("kernel/index.js");
    expect(source).not.toContain("material-import.js");
  });
});
