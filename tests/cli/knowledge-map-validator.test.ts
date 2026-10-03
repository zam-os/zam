import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateKnowledgeMap } from "../../src/cli/knowledge-map/validator.js";
import type { KnowledgeMap } from "../../src/cli/knowledge-map/types.js";

describe("knowledge-map validator (ADR 2026-10-03)", () => {
  const repoRoot = process.cwd();
  const mapPath = join(repoRoot, "docs", "knowledge-map", "map.json");

  it("validates ZAM's own repository map file without errors", () => {
    const raw = readFileSync(mapPath, "utf-8");
    const data = JSON.parse(raw);
    const result = validateKnowledgeMap(data, repoRoot);

    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("fails if root or focus_question is missing", () => {
    const invalid = {
      statements: [],
      relations: [],
    };
    const res = validateKnowledgeMap(invalid, repoRoot);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain(
      "Knowledge map must define a non-empty 'root' statement ID",
    );
    expect(res.errors).toContain(
      "Knowledge map must define a non-empty 'focus_question'",
    );
  });

  it("enforces max statement length of 140 characters", () => {
    const data: KnowledgeMap = {
      root: "root",
      focus_question: "Focus?",
      statements: [
        {
          id: "root",
          statement: "A".repeat(141),
          sources: ["AGENTS.md"],
        },
      ],
      relations: [],
    };
    const res = validateKnowledgeMap(data, repoRoot);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("exceeds 140 characters"))).toBe(
      true,
    );
  });

  it("rejects nonexistent source paths", () => {
    const data: KnowledgeMap = {
      root: "root",
      focus_question: "Focus?",
      statements: [
        {
          id: "root",
          statement: "A valid statement.",
          sources: ["nonexistent/file/path.md"],
        },
      ],
      relations: [],
    };
    const res = validateKnowledgeMap(data, repoRoot);
    expect(res.valid).toBe(false);
    expect(
      res.errors.some((e) => e.includes("cites nonexistent source path")),
    ).toBe(true);
  });

  it("rejects relations with unknown kinds", () => {
    const data = {
      root: "root",
      focus_question: "Focus?",
      statements: [
        { id: "root", statement: "Root", sources: ["AGENTS.md"] },
        { id: "child", statement: "Child", sources: ["AGENTS.md"] },
      ],
      relations: [
        { from: "root", to: "child", kind: "unknown_kind" },
      ],
    };
    const res = validateKnowledgeMap(data, repoRoot);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("invalid kind: 'unknown_kind'"))).toBe(
      true,
    );
  });

  it("rejects dangling relations", () => {
    const data = {
      root: "root",
      focus_question: "Focus?",
      statements: [{ id: "root", statement: "Root", sources: ["AGENTS.md"] }],
      relations: [
        { from: "root", to: "dangling", kind: "elaborates" },
      ],
    };
    const res = validateKnowledgeMap(data, repoRoot);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("missing 'to': 'dangling'"))).toBe(
      true,
    );
  });

  it("enforces elaborates tree constraints: single parent and reachability", () => {
    // child2 has no elaborates parent
    const data: KnowledgeMap = {
      root: "root",
      focus_question: "Focus?",
      statements: [
        { id: "root", statement: "Root", sources: ["AGENTS.md"] },
        { id: "child1", statement: "Child 1", sources: ["AGENTS.md"] },
        { id: "child2", statement: "Child 2", sources: ["AGENTS.md"] },
      ],
      relations: [
        { from: "root", to: "child1", kind: "elaborates" },
      ],
    };
    const res = validateKnowledgeMap(data, repoRoot);
    expect(res.valid).toBe(false);
    expect(
      res.errors.some((e) => e.includes("Non-root statement 'child2' has no 'elaborates' parent")),
    ).toBe(true);
  });

  it("detects cycles in elaborates relations", () => {
    const data = {
      root: "root",
      focus_question: "Focus?",
      statements: [
        { id: "root", statement: "Root", sources: ["AGENTS.md"] },
        { id: "nodeA", statement: "Node A", sources: ["AGENTS.md"] },
        { id: "nodeB", statement: "Node B", sources: ["AGENTS.md"] },
      ],
      relations: [
        { from: "nodeB", to: "nodeA", kind: "elaborates" },
        { from: "nodeA", to: "nodeB", kind: "elaborates" },
      ],
    };
    const res = validateKnowledgeMap(data, repoRoot);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("Cycle detected"))).toBe(true);
  });

  it("validates diagnostic probes refer to existing statements", () => {
    const data = {
      root: "root",
      focus_question: "Focus?",
      statements: [{ id: "root", statement: "Root statement", sources: ["AGENTS.md"] }],
      relations: [],
      probes: [
        { id: "probe-1", question: "Why?", answers: ["nonexistent-statement-id"] },
      ],
    };
    const res = validateKnowledgeMap(data, repoRoot);
    expect(res.valid).toBe(false);
    expect(
      res.errors.some((e) => e.includes("nonexistent answer statement 'nonexistent-statement-id'")),
    ).toBe(true);
  });
});

