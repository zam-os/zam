import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestAgentCompletion } from "../../src/cli/llm/client.js";
import {
  analyzeMaterialText,
  analyzeMaterialViaLLM,
  MATERIAL_FILE_MAX_BYTES,
  type MaterialAnalyzeDeps,
  materialImportModels,
  materialSelection,
} from "../../src/cli/llm/material-analyze.js";
import { stageMaterialImport } from "../../src/cli/material-staging.js";
import {
  type CapabilityFlags,
  createToken,
  type Database,
  type ModelCapability,
  type ModelEntry,
  openDatabase,
  saveMachineAiModels,
} from "../../src/kernel/index.js";

/**
 * The built-in path (ADR 2026-10-05 Decisions 1, 3, 11). Every file here is
 * synthetic, and no request leaves the test: `fetch` and `sips` are mocked.
 */

const FIXTURE = JSON.parse(
  readFileSync(
    join(__dirname, "../fixtures/material-import/chemie-sinne.json"),
    "utf8",
  ),
) as { analysis: unknown; proposals: Array<Record<string, unknown>> };

function flags(...caps: ModelCapability[]): CapabilityFlags {
  return {
    text: caps.includes("text"),
    embedding: caps.includes("embedding"),
    image: caps.includes("image"),
    video: caps.includes("video"),
    file: caps.includes("file"),
    stt: caps.includes("stt"),
    tts: caps.includes("tts"),
  };
}

function row(over: Partial<ModelEntry> & { id: string }): ModelEntry {
  return {
    label: over.id,
    url: "https://openrouter.ai/api/v1",
    model: "openai/gpt-6-luna",
    local: false,
    apiFlavor: "chat-completions",
    order: 0,
    capabilities: flags("text", "image"),
    detectedCapabilities: flags("text", "image"),
    ...over,
  };
}

/** A chat-completions answer carrying the proposals. */
function answer(proposals = FIXTURE.proposals): Response {
  return new Response(
    JSON.stringify({
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: JSON.stringify({ analysis: FIXTURE.analysis, proposals }),
          },
        },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

type Call = { url: string; body: Record<string, unknown> };

function recordingFetch(respond: (call: Call, index: number) => Response): {
  fetch: NonNullable<MaterialAnalyzeDeps["fetch"]>;
  calls: Call[];
} {
  const calls: Call[] = [];
  return {
    calls,
    fetch: async (url, init) => {
      const call = { url, body: JSON.parse(String(init.body)) };
      calls.push(call);
      return respond(call, calls.length - 1);
    },
  };
}

function userParts(call: Call): Array<Record<string, unknown>> {
  const messages = call.body.messages as Array<{ content: unknown }>;
  return messages[messages.length - 1].content as Array<
    Record<string, unknown>
  >;
}

describe("material selection", () => {
  it("takes up to ten photos or one PDF, never both", () => {
    expect(materialSelection(["/a.jpg", "/b.HEIC"])).toEqual({
      ok: true,
      kind: "image",
    });
    expect(materialSelection(["/a.pdf"])).toEqual({ ok: true, kind: "pdf" });
    expect(materialSelection([])).toMatchObject({ code: "no-files" });
    expect(materialSelection(["/a.jpg", "/b.pdf"])).toMatchObject({
      code: "mixed",
    });
    expect(materialSelection(["/a.pdf", "/b.pdf"])).toMatchObject({
      code: "one-pdf",
    });
    expect(
      materialSelection(Array.from({ length: 11 }, (_, i) => `/${i}.png`)),
    ).toMatchObject({ code: "too-many" });
    expect(materialSelection(["/notes.docx"])).toMatchObject({
      code: "unsupported",
    });
  });
});

describe("analyzeMaterialViaLLM", () => {
  let dir: string;
  let db: Database;
  let previousConfig: string | undefined;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-material-analyze-"));
    previousConfig = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(dir, "config.json");
    db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    if (previousConfig === undefined) delete process.env.ZAM_CONFIG_PATH;
    else process.env.ZAM_CONFIG_PATH = previousConfig;
    rmSync(dir, { recursive: true, force: true });
  });

  function file(name: string, bytes: Buffer | string = "synthetic"): string {
    const path = join(dir, name);
    writeFileSync(path, bytes);
    return path;
  }

  it.each(["jpg", "pdf"])(
    "reads a %s through the configured agent and removes its working copy",
    async (extension) => {
      saveMachineAiModels([
        row({
          id: "Codex",
          transport: "agent",
          agentHarness: "codex",
          url: "",
          capabilities: flags("text", "image", "file"),
          detectedCapabilities: flags("text", "image", "file"),
        }),
      ]);
      expect(await materialImportModels(db, "linux")).toMatchObject({
        image: { label: "Codex" },
        file: { label: "Codex" },
        text: { label: "Codex" },
      });
      const source = file(`material.${extension}`, "synthetic material bytes");
      let workingCopy = "";
      const fetch = vi.fn();
      const result = await analyzeMaterialViaLLM(
        db,
        [source],
        { pages: "2-3" },
        {
          platform: "linux",
          fetch,
          requestAgent: async (endpoint, request) => {
            expect(endpoint).toEqual({
              agentHarness: "codex",
              model: "openai/gpt-6-luna",
            });
            expect(request.system).toContain(
              "Use only these pages of the PDF: 2-3.",
            );
            expect(request.timeoutMs).toBe(300_000);
            const paths =
              extension === "pdf" ? request.pdfPaths : request.imagePaths;
            expect(paths).toHaveLength(1);
            workingCopy = paths![0];
            expect(workingCopy).not.toBe(source);
            expect(readFileSync(workingCopy, "utf8")).toBe(
              "synthetic material bytes",
            );
            expect(
              extension === "pdf" ? request.imagePaths : request.pdfPaths,
            ).toBeUndefined();
            return JSON.stringify({
              analysis: FIXTURE.analysis,
              proposals: FIXTURE.proposals,
            });
          },
        },
      );
      expect(fetch).not.toHaveBeenCalled();
      expect(existsSync(workingCopy)).toBe(false);
      expect(existsSync(source)).toBe(true);
      expect(result.set.files[0].sourceLink).toContain(`material.${extension}`);
      expect(result.set.proposals).not.toHaveLength(0);
      expect(result.sentTo).toEqual([
        { label: "Codex", model: "openai/gpt-6-luna" },
      ]);
    },
  );

  it("cleans up a rejected agent import and follows the configured fallback", async () => {
    saveMachineAiModels([
      row({
        id: "Codex",
        transport: "agent",
        agentHarness: "codex",
        url: "",
        order: 0,
      }),
      row({ id: "Cloud", order: 1 }),
    ]);
    let workingCopy = "";
    const { fetch } = recordingFetch(() => answer());
    const result = await analyzeMaterialViaLLM(
      db,
      [file("photo.png")],
      {},
      {
        platform: "linux",
        fetch,
        requestAgent: async (_endpoint, request) => {
          workingCopy = request.imagePaths![0];
          throw new Error("agent unavailable");
        },
      },
    );
    expect(existsSync(workingCopy)).toBe(false);
    expect(result.model.label).toBe("Cloud");
    expect(result.sentTo.map((model) => model.label)).toEqual([
      "Codex",
      "Cloud",
    ]);
  });

  it("rejects invalid agent output and cleans up without writing a card", async () => {
    saveMachineAiModels([
      row({ id: "Codex", transport: "agent", agentHarness: "codex", url: "" }),
    ]);
    let workingCopy = "";
    await expect(
      analyzeMaterialViaLLM(
        db,
        [file("photo.png")],
        {},
        {
          platform: "linux",
          requestAgent: async (_endpoint, request) => {
            workingCopy = request.imagePaths![0];
            return "I cannot read this file";
          },
        },
      ),
    ).rejects.toMatchObject({ code: "model-failed" });
    expect(existsSync(workingCopy)).toBe(false);
    expect(
      await db.prepare("SELECT count(*) AS n FROM cards").get(),
    ).toMatchObject({ n: 0 });
  });

  it("also sends typed notes through an agent, without attachments", async () => {
    saveMachineAiModels([
      row({ id: "Codex", transport: "agent", agentHarness: "codex", url: "" }),
    ]);
    const result = await analyzeMaterialText(
      db,
      "learner notes",
      {},
      {
        requestAgent: async (_endpoint, request) => {
          expect(request.user).toContain("learner notes");
          expect(request.imagePaths).toEqual([]);
          expect(request.pdfPaths).toBeUndefined();
          expect(request.isolate).toBe(true);
          return JSON.stringify({
            analysis: FIXTURE.analysis,
            proposals: FIXTURE.proposals,
          });
        },
      },
    );
    expect(result.model.label).toBe("Codex");
    expect(result.set.files[0].sourceLink).toMatch(/^notes:/);
  });

  it("skips agents that cannot run without their tools", async () => {
    saveMachineAiModels([
      row({
        id: "Gemini",
        transport: "agent",
        agentHarness: "antigravity",
        url: "",
        order: 0,
      }),
      row({ id: "Cloud", order: 1 }),
    ]);
    const requestAgent = vi.fn();
    const { fetch } = recordingFetch(() => answer());
    const result = await analyzeMaterialViaLLM(
      db,
      [file("photo.png")],
      {},
      { platform: "linux", fetch, requestAgent },
    );
    expect(requestAgent).not.toHaveBeenCalled();
    expect(result.sentTo.map((model) => model.label)).toEqual(["Cloud"]);
  });

  it("refuses an isolated run on an adapter that cannot isolate", async () => {
    await expect(
      requestAgentCompletion(
        { agentHarness: "antigravity" },
        { system: "read", user: "notes", isolate: true },
      ),
    ).rejects.toThrow("cannot run without its tools");
  });

  it("refuses PDF paths before launching an adapter without document support", async () => {
    await expect(
      requestAgentCompletion(
        { agentHarness: "antigravity" },
        {
          system: "read",
          user: "read",
          pdfPaths: ["/not-opened.pdf"],
        },
      ),
    ).rejects.toThrow("does not support PDF input");
  });

  it("sends photos to the image model and returns a validated set", async () => {
    saveMachineAiModels([row({ id: "Luna" })]);
    await createToken(db, {
      slug: "a",
      concept: "a",
      domain: "chemie/stoffe",
    });
    const photo = file("Seite 1.jpg");
    const { fetch, calls } = recordingFetch(() => answer());
    const log = vi.spyOn(console, "log");
    const error = vi.spyOn(console, "error");

    const result = await analyzeMaterialViaLLM(
      db,
      [photo],
      {},
      { fetch, platform: "linux" },
    );

    expect(result.model).toEqual({
      label: "Luna",
      model: "openai/gpt-6-luna",
    });
    expect(result.set.proposals).toHaveLength(4);
    expect(result.set.proposals[0].area).toBe(
      "chemie/stoffe-und-eigenschaften",
    );
    expect(result.set.files[0]).toMatchObject({
      name: "Seite 1.jpg",
      path: photo,
    });
    expect(result.set.files[0].sourceLink).toMatch(
      /^file:\/\/.*Seite%201\.jpg$/,
    );
    expect(result.set.files[0].sha256).toMatch(/^[0-9a-f]{64}$/);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(userParts(calls[0])[0]).toEqual({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${Buffer.from("synthetic").toString("base64")}`,
      },
    });
    const system = (calls[0].body.messages as Array<{ content: string }>)[0]
      .content;
    expect(system).toContain(
      "Areas already in the learner's library: chemie/stoffe",
    );
    // Nothing of the material or the answer is logged.
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    log.mockRestore();
    error.mockRestore();
  });

  it("sends typed notes as text with the place, and keeps only their fingerprint", async () => {
    saveMachineAiModels([
      row({
        id: "Text",
        capabilities: flags("text"),
        detectedCapabilities: flags("text"),
      }),
    ]);
    const notes =
      "Brechung: Licht knickt zum Lot hin, wenn es ins Wasser geht.";
    const { fetch, calls } = recordingFetch(() =>
      answer(
        FIXTURE.proposals.map((p) => ({
          ...p,
          file: 3,
          page: 2,
          placeBelow: ["Lichtbrechung"],
        })),
      ),
    );
    const log = vi.spyOn(console, "log");
    const result = await analyzeMaterialText(
      db,
      notes,
      {
        title: "Physik-Heft",
        place: {
          lens: "weltwissen",
          regionKey: "natur.physik.optik",
          path: ["Natur", "Physik", "Licht & Wellen"],
          missingLevels: ["Thema"],
          units: [{ key: "atom:01X", title: "Snelliussches Brechungsgesetz" }],
        },
      },
      { fetch },
    );

    // One text request: the notes in the user turn, the place in the system.
    expect(calls).toHaveLength(1);
    const parts = userParts(calls[0]);
    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    expect(String(parts[0].text)).toContain(notes);
    const system = (calls[0].body.messages as Array<{ content: string }>)[0]
      .content;
    expect(system).toContain("Natur › Physik › Licht & Wellen");
    expect(system).toContain("placeBelow");
    expect(system).toContain("atom:01X (Snelliussches Brechungsgesetz)");

    // Every card points at the one text; the set carries the place.
    expect(result.set.place).toEqual({
      lens: "weltwissen",
      regionKey: "natur.physik.optik",
    });
    expect(
      result.set.proposals.every((p) => p.file === 0 && p.page === null),
    ).toBe(true);
    expect(result.set.proposals[0].placeBelow).toEqual(["Lichtbrechung"]);
    expect(result.set.files).toHaveLength(1);
    expect(result.set.files[0].sourceLink).toMatch(
      /^notes:Physik-Heft@\d{4}-\d{2}-\d{2}$/,
    );
    expect(result.set.files[0].sha256).toMatch(/^[0-9a-f]{64}$/);
    // The notes themselves are nowhere in the set, nor in the staged batch.
    expect(JSON.stringify(result.set)).not.toContain("knickt zum Lot");
    const staged = await stageMaterialImport(
      { set: result.set, origin: "studio" },
      { dir: join(dir, "pending") },
    );
    const file = readFileSync(
      join(dir, "pending", `${staged.id}.json`),
      "utf8",
    );
    expect(file).not.toContain("knickt zum Lot");
    expect(file).toContain("natur.physik.optik");
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("refuses notes without a text model, and empty notes", async () => {
    saveMachineAiModels([
      row({
        id: "Bilder",
        capabilities: flags("image"),
        detectedCapabilities: flags("image"),
      }),
    ]);
    await expect(analyzeMaterialText(db, "Etwas")).rejects.toMatchObject({
      code: "no-text-model",
    });
    await expect(analyzeMaterialText(db, "   ")).rejects.toMatchObject({
      code: "no-files",
    });
  });

  it("sends a PDF only to a row that reads PDFs itself", async () => {
    saveMachineAiModels([row({ id: "Vision only" })]);
    const pdf = file("Arbeitsblatt.pdf", "%PDF-1.7");
    const { fetch, calls } = recordingFetch(() => answer());
    await expect(
      analyzeMaterialViaLLM(db, [pdf], {}, { fetch }),
    ).rejects.toMatchObject({ code: "no-file-model" });
    expect(calls).toHaveLength(0);

    saveMachineAiModels([
      row({ id: "Vision only", order: 0 }),
      row({
        id: "Reader",
        order: 1,
        model: "openai/gpt-6-luna-files",
        capabilities: flags("text", "image", "file"),
        detectedCapabilities: flags("text", "image", "file"),
      }),
    ]);
    expect(await materialImportModels(db, "linux")).toEqual({
      image: { label: "Vision only", model: "openai/gpt-6-luna" },
      file: { label: "Reader", model: "openai/gpt-6-luna-files" },
      // Typed notes go to the first text row.
      text: { label: "Vision only", model: "openai/gpt-6-luna" },
      convertsHeic: false,
    });
    const result = await analyzeMaterialViaLLM(
      db,
      [pdf],
      { pages: "2-3" },
      { fetch },
    );
    expect(result.model.label).toBe("Reader");
    expect(calls[0].body.model).toBe("openai/gpt-6-luna-files");
    expect(userParts(calls[0])[0]).toMatchObject({ type: "file" });
    expect(calls[0].body.plugins).toEqual([
      { id: "file-parser", pdf: { engine: "native" } },
    ]);
    expect(
      (calls[0].body.messages as Array<{ content: string }>)[0].content,
    ).toContain("Use only these pages of the PDF: 2-3.");
  });

  it("refuses without an image model, HEIC off macOS, and oversized photos", async () => {
    const photo = file("a.jpg");
    await expect(
      analyzeMaterialViaLLM(db, [photo], {}, { platform: "linux" }),
    ).rejects.toMatchObject({ code: "no-image-model" });

    saveMachineAiModels([row({ id: "Luna" })]);
    await expect(
      analyzeMaterialViaLLM(
        db,
        [file("IMG_1.HEIC")],
        {},
        { platform: "linux" },
      ),
    ).rejects.toMatchObject({ code: "heic" });
    await expect(
      analyzeMaterialViaLLM(
        db,
        [file("big.png", Buffer.alloc(MATERIAL_FILE_MAX_BYTES + 1))],
        {},
        { platform: "linux" },
      ),
    ).rejects.toMatchObject({ code: "too-large" });
  });

  it("splits photos when the provider rejects too many, and merges the cards", async () => {
    saveMachineAiModels([row({ id: "Luna" })]);
    const photos = ["1.jpg", "2.jpg", "3.jpg"].map((name) => file(name));
    const { fetch, calls } = recordingFetch((call) => {
      const images = userParts(call).filter((p) => p.type === "image_url");
      if (images.length > 2) {
        return new Response("Too many images: maximum is 2", { status: 400 });
      }
      // Each batch proposes one card about its last photo.
      return answer([{ ...FIXTURE.proposals[0], file: images.length - 1 }]);
    });
    const progress: Array<{ done: number; total: number }> = [];
    const result = await analyzeMaterialViaLLM(
      db,
      photos,
      {},
      { fetch, platform: "linux", onProgress: (p) => progress.push(p) },
    );
    expect(calls.map((call) => userParts(call).length - 1)).toEqual([3, 2, 1]);
    // The second batch's photo 0 is the import's photo 2.
    expect(result.set.proposals.map((p) => p.file)).toEqual([1, 2]);
    expect(progress.at(-1)).toEqual({ done: 2, total: 2 });
  });

  it("hands the request to the next model when a split still fails, and names who read it", async () => {
    saveMachineAiModels([
      row({ id: "Gemma", model: "vendor/gemma", order: 0 }),
      row({ id: "Luna", model: "vendor/luna", order: 1 }),
    ]);
    const photos = ["1.jpg", "2.jpg"].map((name) => file(name));
    const { fetch, calls } = recordingFetch((call) => {
      if (call.body.model === "vendor/gemma") {
        // Even one image is too much for this one.
        return new Response("Too many images: maximum is 0", { status: 400 });
      }
      return answer();
    });
    const progress: Array<{ done: number; total: number }> = [];
    const result = await analyzeMaterialViaLLM(
      db,
      photos,
      {},
      { fetch, platform: "linux", onProgress: (p) => progress.push(p) },
    );
    expect(
      calls.map((call) => [call.body.model, userParts(call).length - 1]),
    ).toEqual([
      ["vendor/gemma", 2],
      ["vendor/gemma", 1],
      ["vendor/luna", 2],
    ]);
    // The dialog named Gemma; Luna read the pages, and both got them.
    expect(result.model).toEqual({ label: "Luna", model: "vendor/luna" });
    expect(result.sentTo.map((m) => m.label)).toEqual(["Gemma", "Luna"]);
    expect(progress.at(-1)).toEqual({ done: 1, total: 1 });
  });

  it("rejects a split answer whose file number points outside its batch", async () => {
    saveMachineAiModels([row({ id: "Luna" })]);
    const photos = ["1.jpg", "2.jpg", "3.jpg"].map((name) => file(name));
    const { fetch } = recordingFetch((call) => {
      const images = userParts(call).filter((p) => p.type === "image_url");
      if (images.length > 2) {
        return new Response("Too many images: maximum is 2", { status: 400 });
      }
      // Photo 2 exists in the import, but not in either batch.
      return answer([{ ...FIXTURE.proposals[0], file: 2 }]);
    });
    await expect(
      analyzeMaterialViaLLM(db, photos, {}, { fetch, platform: "linux" }),
    ).rejects.toMatchObject({ code: "invalid-answer" });
  });

  it("converts HEIC and scales large photos with sips on macOS, then cleans up", async () => {
    saveMachineAiModels([row({ id: "Luna" })]);
    const heic = file("IMG_1.HEIC");
    const small = file("small.png");
    const outputs: string[] = [];
    const sips = vi.fn(async (args: string[]) => {
      if (args[0] === "-g") {
        return args.at(-1) === small
          ? "  pixelWidth: 800\n  pixelHeight: 600\n"
          : "  pixelWidth: 4032\n  pixelHeight: 3024\n";
      }
      const out = args[args.indexOf("--out") + 1];
      outputs.push(out);
      writeFileSync(out, "jpeg");
      return "";
    });
    const { fetch, calls } = recordingFetch(() => answer());
    await analyzeMaterialViaLLM(
      db,
      [heic, small],
      {},
      { fetch, platform: "darwin", sips },
    );
    expect(sips).toHaveBeenCalledWith([
      "-s",
      "format",
      "jpeg",
      "-Z",
      "1568",
      heic,
      "--out",
      outputs[0],
    ]);
    const parts = userParts(calls[0]);
    expect(parts[0]).toMatchObject({
      image_url: {
        url: `data:image/jpeg;base64,${Buffer.from("jpeg").toString("base64")}`,
      },
    });
    // A photo within the long edge goes as it is.
    expect(parts[1]).toMatchObject({
      image_url: { url: expect.stringMatching(/^data:image\/png;base64,/) },
    });
    expect(outputs).toHaveLength(1);
    expect(existsSync(outputs[0])).toBe(false);
  });

  it("names an answer that does not fit the contract", async () => {
    saveMachineAiModels([row({ id: "Luna" })]);
    const { fetch } = recordingFetch(() =>
      answer([{ question: "Nur eine Frage" }]),
    );
    await expect(
      analyzeMaterialViaLLM(
        db,
        [file("a.jpg")],
        {},
        { fetch, platform: "linux" },
      ),
    ).rejects.toMatchObject({ code: "invalid-answer" });
  });
});
