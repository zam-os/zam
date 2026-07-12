import { describe, expect, it } from "vitest";
import {
  type CapabilityProbeResult,
  classifyCapabilities,
  reconcileCapabilities,
  validateModelSave,
} from "../../src/cli/llm/capability-probe.js";
import {
  type CapabilityFlags,
  emptyCapabilityFlags,
  type ModelEntry,
} from "../../src/kernel/index.js";

function caps(over: Partial<CapabilityFlags> = {}): CapabilityFlags {
  return { ...emptyCapabilityFlags(), ...over };
}

describe("classifyCapabilities", () => {
  it("treats a chat model listed in the catalog as text", () => {
    const d = classifyCapabilities(
      { model: "gemma4-it:e4b", apiFlavor: "chat-completions" },
      ["gemma4-it:e4b", "other"],
      true,
    );
    expect(d).toEqual(caps({ text: true }));
  });

  it("trusts chat-completions text when the catalog is silent", () => {
    const d = classifyCapabilities(
      { model: "mystery-local", apiFlavor: "chat-completions" },
      [],
      false,
    );
    expect(d.text).toBe(true);
    expect(d.embedding).toBe(false);
  });

  it("marks embedding models as embedding-only (not text)", () => {
    const d = classifyCapabilities(
      { model: "embeddinggemma", apiFlavor: "chat-completions" },
      [],
      false,
    );
    expect(d).toEqual(caps({ embedding: true }));
  });

  it("marks multimodal chat models as text + image", () => {
    const d = classifyCapabilities(
      { model: "gpt-4o", apiFlavor: "chat-completions" },
      ["gpt-4o"],
      true,
    );
    expect(d.text).toBe(true);
    expect(d.image).toBe(true);
  });

  it("fixes anthropic endpoints to text + image regardless of model", () => {
    const d = classifyCapabilities(
      { model: "claude-haiku-4-5", apiFlavor: "anthropic-messages" },
      [],
      false,
    );
    expect(d).toEqual(caps({ text: true, image: true }));
  });

  it("does not claim text for a model absent from a known catalog", () => {
    const d = classifyCapabilities(
      { model: "ghost", apiFlavor: "chat-completions" },
      ["served-a", "served-b"],
      true,
    );
    expect(d).toEqual(emptyCapabilityFlags());
  });

  it("honors a positive embedding dimension probe when the catalog is silent", () => {
    const d = classifyCapabilities(
      { model: "custom-vectors", apiFlavor: "chat-completions" },
      [],
      false,
      true,
    );
    expect(d.embedding).toBe(true);
    expect(d.text).toBe(false);
  });
});

describe("reconcileCapabilities", () => {
  it("keeps only user-selected flags the probe detected", () => {
    const result = reconcileCapabilities(
      caps({ text: true, image: true, embedding: true }),
      caps({ text: true, image: false, embedding: true }),
    );
    expect(result).toEqual(caps({ text: true, embedding: true }));
  });
});

describe("validateModelSave", () => {
  const entry: ModelEntry = {
    id: "e1",
    label: "Local",
    url: "http://localhost:8000/v1",
    model: "gemma",
    local: true,
    apiFlavor: "chat-completions",
    order: 0,
    capabilities: caps({ text: true, image: true }),
    detectedCapabilities: emptyCapabilityFlags(),
  };

  it("blocks the save when the endpoint is unreachable", () => {
    const probe: CapabilityProbeResult = {
      reachable: false,
      catalog: [],
      detected: emptyCapabilityFlags(),
    };
    const result = validateModelSave(entry, probe);
    expect(result.ok).toBe(false);
    expect(result.entry).toBeUndefined();
    expect(result.error).toMatch(/unreachable/i);
  });

  it("stamps detected capabilities and shrinks user flags to the intersection", () => {
    const probe: CapabilityProbeResult = {
      reachable: true,
      catalog: ["gemma"],
      detected: caps({ text: true }), // image not detected
    };
    const result = validateModelSave(
      entry,
      probe,
      () => "2026-07-12T00:00:00Z",
    );
    expect(result.ok).toBe(true);
    expect(result.entry?.capabilities).toEqual(caps({ text: true }));
    expect(result.entry?.detectedCapabilities).toEqual(caps({ text: true }));
    expect(result.entry?.probedAt).toBe("2026-07-12T00:00:00Z");
  });
});
