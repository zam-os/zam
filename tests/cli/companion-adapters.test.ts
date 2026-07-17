import { describe, expect, it } from "vitest";
import {
  buildModelQuickPickItems,
  type ChooseRecallModelSurface,
  createVscodeLmAdapter,
  runChooseRecallModel,
  type VscodeChatModelLike,
  type VscodeLmSurface,
  type VscodeModelSelection,
} from "../../src/vscode-extension/companion-adapters.js";
import { EvaluatorUnavailableError } from "../../src/vscode-extension/companion-evaluator.js";

/**
 * Runtime-shaped regression test (ADR 2026-07-16 §Decision 6, 0.11.0 Phase
 * 3). The 0.10.11 crash happened because `vscode.CancellationToken.None` is
 * undefined in the real extension-host runtime, and the locally invented
 * `vscode.d.ts` declared it anyway — so `sendRequest` received `undefined`
 * as its cancellation token and failed before the request was sent.
 *
 * Every fake `VscodeLmSurface` below is built WITHOUT any `.None`-like
 * shortcut: the only way to obtain a token is `createCancellationTokenSource()`,
 * matching the runtime that was actually observed. A `sendRequest` fake that
 * throws on `token === undefined` stands in for the real crash — if
 * `companion-adapters.ts` ever regressed to passing `CancellationToken.None`
 * (or simply forgot to pass a token), these tests would fail exactly the way
 * the field crash did.
 */

function memorySelection(initial?: string): VscodeModelSelection {
  let current = initial;
  return {
    getSelectedModelId: () => current,
    setSelectedModelId: (id) => {
      current = id;
    },
  };
}

function fakeModel(
  overrides: Partial<VscodeChatModelLike> & { id: string },
): VscodeChatModelLike {
  return {
    vendor: "copilot",
    name: "Test Model",
    sendRequest: async (_messages, _options, token) => {
      // Reproduces the exact 0.10.11 crash shape: the real bug was
      // `sendRequest` dereferencing an undefined cancellation token.
      if (token === undefined) {
        throw new TypeError(
          "Cannot read properties of undefined (reading 'isCancellationRequested')",
        );
      }
      return {
        text: (async function* () {
          yield "ok";
        })(),
      };
    },
    ...overrides,
  };
}

function fakeSurface(models: VscodeChatModelLike[]): {
  surface: VscodeLmSurface;
  disposed: string[];
  tokens: unknown[];
} {
  const disposed: string[] = [];
  const tokens: unknown[] = [];
  let count = 0;
  const surface: VscodeLmSurface = {
    selectChatModels: async () => models,
    chatMessageUser: (text) => ({ role: "user", text }),
    chatMessageAssistant: (text) => ({ role: "assistant", text }),
    // Deliberately the ONLY way to obtain a token — no `.None` anywhere on
    // this fake, matching the real runtime.
    createCancellationTokenSource: () => {
      count += 1;
      const id = `token-${count}`;
      const token = { isCancellationRequested: false, id };
      tokens.push(token);
      return {
        token,
        dispose: () => disposed.push(id),
      };
    },
  };
  return { surface, disposed, tokens };
}

describe("companion-adapters — vscode-lm runtime-shaped regression", () => {
  it("passes a real CancellationToken from CancellationTokenSource, never undefined, and disposes it", async () => {
    const model = fakeModel({ id: "m1" });
    const { surface, disposed } = fakeSurface([model]);
    const adapter = createVscodeLmAdapter(surface, memorySelection());

    const result = await adapter.evaluateAnswer({
      messages: [{ role: "user", text: "hi" }],
    });

    expect(result).toEqual({ model: "m1", text: "ok" });
    expect(disposed).toEqual(["token-1"]);
  });

  it("disposes the token source even when sendRequest throws", async () => {
    const model = fakeModel({
      id: "m1",
      sendRequest: async () => {
        throw new Error("boom");
      },
    });
    const { surface, disposed } = fakeSurface([model]);
    const adapter = createVscodeLmAdapter(surface, memorySelection());

    await expect(
      adapter.evaluateAnswer({ messages: [{ role: "user", text: "hi" }] }),
    ).rejects.toThrow("boom");
    expect(disposed).toEqual(["token-1"]);
  });

  it("would fail the same way the field crash did if a token were ever omitted", async () => {
    // Sanity check that the fake genuinely reproduces the original bug shape:
    // calling sendRequest with `undefined` as the token throws just like the
    // real VS Code runtime did when `CancellationToken.None` was undefined.
    const model = fakeModel({ id: "m1" });
    await expect(
      model.sendRequest([], {}, undefined),
    ).rejects.toThrow(/isCancellationRequested/);
  });
});

describe("companion-adapters — vscode-lm model discovery and selection", () => {
  it("peeks the first discovered model WITHOUT persisting it via availability/displayIdentity", async () => {
    // Review finding 2: rendering the Agent pill (displayIdentity) or merely
    // probing (availability) must never itself adopt/freeze a model as a
    // side effect — only a real evaluateAnswer/followUp call does that.
    const model = fakeModel({ id: "m1", vendor: "copilot", name: "Claude Sonnet 5" });
    const { surface } = fakeSurface([model]);
    const selection = memorySelection();
    const adapter = createVscodeLmAdapter(surface, selection);

    expect(await adapter.availability()).toEqual({ available: true });
    expect(await adapter.displayIdentity()).toEqual({
      provider: "Copilot",
      model: "Claude Sonnet 5",
    });
    expect(selection.getSelectedModelId()).toBeUndefined();
  });

  it("adopts and persists the first discovered model on the first real evaluateAnswer call", async () => {
    const model = fakeModel({ id: "m1", vendor: "copilot", name: "Claude Sonnet 5" });
    const { surface } = fakeSurface([model]);
    const selection = memorySelection();
    const adapter = createVscodeLmAdapter(surface, selection);

    expect(selection.getSelectedModelId()).toBeUndefined();
    const result = await adapter.evaluateAnswer({
      messages: [{ role: "user", text: "hi" }],
    });
    expect(result.model).toBe("m1");
    // The explicit choice is now persisted — not re-derived from
    // registration order on the next call.
    expect(selection.getSelectedModelId()).toBe("m1");

    // A later probe/render must not re-derive or change it.
    expect(await adapter.displayIdentity()).toEqual({
      provider: "Copilot",
      model: "Claude Sonnet 5",
    });
    expect(selection.getSelectedModelId()).toBe("m1");
  });

  it("honors a persisted explicit choice over VS Code's result order", async () => {
    const first = fakeModel({ id: "m1", vendor: "copilot", name: "First" });
    const second = fakeModel({ id: "m2", vendor: "copilot", name: "Second" });
    const { surface } = fakeSurface([first, second]);
    const selection = memorySelection("m2");
    const adapter = createVscodeLmAdapter(surface, selection);

    expect(await adapter.displayIdentity()).toEqual({
      provider: "Copilot",
      model: "Second",
    });
  });

  it("fails WITHOUT falling back to another model when the persisted choice disappears", async () => {
    const { surface } = fakeSurface([fakeModel({ id: "m-still-here" })]);
    const selection = memorySelection("m-gone");
    const adapter = createVscodeLmAdapter(surface, selection);

    const availability = await adapter.availability();
    expect(availability.available).toBe(false);
    expect(availability.reason).toMatch(/no longer available/i);

    let thrown: unknown;
    try {
      await adapter.evaluateAnswer({ messages: [{ role: "user", text: "hi" }] });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(EvaluatorUnavailableError);
    expect((thrown as EvaluatorUnavailableError).evaluatorId).toBe("vscode-lm");
    // The persisted (now-missing) id was never silently replaced.
    expect(selection.getSelectedModelId()).toBe("m-gone");
  });

  it("reports unavailable with a reason when no VS Code model exists at all", async () => {
    const { surface } = fakeSurface([]);
    const adapter = createVscodeLmAdapter(surface, memorySelection());

    const availability = await adapter.availability();
    expect(availability).toEqual({
      available: false,
      reason: expect.stringMatching(/no vs code language model/i),
    });
    expect(await adapter.displayIdentity()).toEqual({
      provider: "VS Code language model",
    });
  });

  it("surfaces a clean reason instead of throwing when selectChatModels itself rejects", async () => {
    const surface: VscodeLmSurface = {
      selectChatModels: async () => {
        throw new Error("not signed in");
      },
      chatMessageUser: (text) => ({ role: "user", text }),
      chatMessageAssistant: (text) => ({ role: "assistant", text }),
      createCancellationTokenSource: () => ({
        token: {},
        dispose: () => {},
      }),
    };
    const adapter = createVscodeLmAdapter(surface, memorySelection());

    const availability = await adapter.availability();
    expect(availability.available).toBe(false);
    expect(availability.reason).toMatch(/not signed in/);
  });

  it("routes evaluation and at least one follow-up turn through the same adapter/model", async () => {
    const model = fakeModel({ id: "m1", vendor: "copilot", name: "Claude Sonnet 5" });
    const { surface } = fakeSurface([model]);
    const adapter = createVscodeLmAdapter(surface, memorySelection("m1"));

    const evaluation = await adapter.evaluateAnswer({
      messages: [{ role: "user", text: "Evaluate this answer" }],
    });
    const followUp = await adapter.followUp({
      messages: [
        { role: "user", text: "Evaluate this answer" },
        { role: "assistant", text: "Feedback" },
        { role: "user", text: "Why?" },
      ],
    });

    expect(evaluation.model).toBe("m1");
    expect(followUp.model).toBe("m1");
  });
});

describe("buildModelQuickPickItems", () => {
  it("labels each item with vendor and name, and carries the raw model id as detail", () => {
    const items = buildModelQuickPickItems([
      fakeModel({ id: "m1", vendor: "copilot", name: "Claude Sonnet 5" }),
      fakeModel({ id: "m2", vendor: "copilot", name: "GPT-5" }),
      fakeModel({ id: "m3", vendor: "antigravity", name: "Gemini 3.5 Flash" }),
      fakeModel({ id: "m4", vendor: "gemini", name: "Gemini 3.5 Pro" }),
      fakeModel({ id: "m5", vendor: "google", name: "Gemini 1.5 Pro" }),
    ]);
    expect(items).toEqual([
      { label: "Copilot — Claude Sonnet 5", detail: "m1", modelId: "m1" },
      { label: "Copilot — GPT-5", detail: "m2", modelId: "m2" },
      { label: "Antigravity — Gemini 3.5 Flash", detail: "m3", modelId: "m3" },
      { label: "Gemini — Gemini 3.5 Pro", detail: "m4", modelId: "m4" },
      { label: "Google — Gemini 1.5 Pro", detail: "m5", modelId: "m5" },
    ]);
  });
});

describe("runChooseRecallModel — zam.chooseRecallModel command handler", () => {
  function fakeChooseSurface(
    models: VscodeChatModelLike[],
    picked: { label: string; detail: string; modelId: string } | undefined,
  ): {
    surface: ChooseRecallModelSurface;
    infoMessages: string[];
    warnMessages: string[];
  } {
    const infoMessages: string[] = [];
    const warnMessages: string[] = [];
    const surface: ChooseRecallModelSurface = {
      listModels: async () => models,
      showQuickPick: async () => picked,
      showInformationMessage: (message) => {
        infoMessages.push(message);
      },
      showWarningMessage: (message) => {
        warnMessages.push(message);
      },
    };
    return { surface, infoMessages, warnMessages };
  }

  it("persists the picked model and confirms it", async () => {
    const model = fakeModel({ id: "m1", vendor: "copilot", name: "Claude Sonnet 5" });
    const { surface, infoMessages } = fakeChooseSurface(
      [model],
      { label: "Copilot — Claude Sonnet 5", detail: "m1", modelId: "m1" },
    );
    const selection = memorySelection();

    await runChooseRecallModel(surface, selection);

    expect(selection.getSelectedModelId()).toBe("m1");
    expect(infoMessages).toEqual(["ZAM Recall will use Copilot — Claude Sonnet 5."]);
  });

  it("leaves the persisted choice untouched when the QuickPick is dismissed", async () => {
    const model = fakeModel({ id: "m1" });
    const { surface, infoMessages } = fakeChooseSurface([model], undefined);
    const selection = memorySelection("already-chosen");

    await runChooseRecallModel(surface, selection);

    expect(selection.getSelectedModelId()).toBe("already-chosen");
    expect(infoMessages).toEqual([]);
  });

  it("warns instead of showing an empty QuickPick when no model is available", async () => {
    const { surface, warnMessages } = fakeChooseSurface([], undefined);
    const selection = memorySelection();

    await runChooseRecallModel(surface, selection);

    expect(selection.getSelectedModelId()).toBeUndefined();
    expect(warnMessages).toEqual([
      expect.stringMatching(/no vs code language model/i),
    ]);
  });

  it("warns with the error instead of throwing when listing models rejects", async () => {
    const surface: ChooseRecallModelSurface = {
      listModels: async () => {
        throw new Error("not signed in");
      },
      showQuickPick: async () => undefined,
      showInformationMessage: () => {},
      showWarningMessage: () => {},
    };
    const warnings: string[] = [];
    surface.showWarningMessage = (message) => warnings.push(message);
    const selection = memorySelection();

    await runChooseRecallModel(surface, selection);

    expect(warnings).toEqual([expect.stringMatching(/not signed in/)]);
  });
});

