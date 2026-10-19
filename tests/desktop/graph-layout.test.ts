import { describe, expect, it } from "vitest";
import {
  graphEdgeEndpoints,
  graphNodeStyle,
  graphNodeTitle,
  humanizeTokenSlug,
  wrapGraphLabel,
} from "../../desktop/src/panel/graph-layout.js";

describe("2D graph node style", () => {
  it("colours by subject and draws the condition as a stroke pattern", () => {
    const known = graphNodeStyle(
      { domain: "mathematik/geometrie", condition: "known" },
      "light",
    );
    expect(known.dash).toBeNull();
    expect(known.opacity).toBe(1);
    expect(known.fill).toMatch(/^rgba\(/);

    const due = graphNodeStyle(
      { domain: "mathematik/geometrie", condition: "due" },
      "light",
    );
    expect(due.dash).toBe("2 2");
    expect(due.stroke).not.toBe(known.stroke);

    expect(
      graphNodeStyle({ domain: "mathematik", condition: "decaying" }, "light")
        .dash,
    ).toBe("7 2 1 2");
    expect(
      graphNodeStyle({ domain: "mathematik", condition: "forgotten" }, "dark")
        .opacity,
    ).toBe(0.6);
    expect(
      graphNodeStyle({ domain: "mathematik", condition: null }, "light").dash,
    ).toBe("4 3");
  });

  it("prefers the bridge's hue key over the domain", () => {
    const byKey = graphNodeStyle(
      { domain: "irgendwas", hueKey: "chemie", condition: "known" },
      "light",
    );
    const byDomain = graphNodeStyle(
      { domain: "chemie/stoffe", condition: "known" },
      "light",
    );
    expect(byKey.stroke).toBe(byDomain.stroke);
  });
});

describe("2D graph presentation", () => {
  it("prefers an explicit token title", () => {
    expect(
      graphNodeTitle({
        slug: "zam-mcp-server-architecture",
        title: "MCP server architecture",
        display_title: "zam-mcp-server-architecture",
      }),
    ).toBe("MCP server architecture");
  });

  it("turns legacy slugs into readable title labels", () => {
    expect(humanizeTokenSlug("zam-mcp-server-architecture")).toBe(
      "ZAM MCP Server Architecture",
    );
    expect(
      graphNodeTitle({
        slug: "agent-skill-installation-scope-tradeoff",
        title: "",
        display_title: "agent-skill-installation-scope-tradeoff",
      }),
    ).toBe("Agent Skill Installation Scope Tradeoff");
  });

  it("balances readable titles across up to three lines", () => {
    expect(wrapGraphLabel("Agent Skill Installation Scope Tradeoff")).toEqual([
      "Agent Skill",
      "Installation",
      "Scope Tradeoff",
    ]);
    expect(wrapGraphLabel("ZAM MCP Server Architecture")).toEqual([
      "ZAM MCP Server",
      "Architecture",
    ]);
  });

  it("ellipsizes only after the multiline budget is exhausted", () => {
    const lines = wrapGraphLabel(
      "One two three four five six seven eight nine ten eleven",
      10,
      3,
    );
    expect(lines).toHaveLength(3);
    expect(lines.every((line) => line.length <= 10)).toBe(true);
    expect(lines[2].endsWith("…")).toBe(true);
  });

  it("terminates horizontal edges outside both node rectangles", () => {
    const edge = graphEdgeEndpoints(
      { x: 0, y: 0, width: 100, height: 40 },
      { x: 200, y: 0, width: 80, height: 40 },
    );
    expect(edge).toEqual({
      start: { x: 54, y: 0 },
      end: { x: 156, y: 0 },
    });
  });

  it("clips diagonal edges against the first rectangle boundary hit", () => {
    const edge = graphEdgeEndpoints(
      { x: 0, y: 0, width: 100, height: 40 },
      { x: 100, y: 100, width: 60, height: 60 },
      0,
    );
    expect(edge.start).toEqual({ x: 20, y: 20 });
    expect(edge.end).toEqual({ x: 70, y: 70 });
  });
});
