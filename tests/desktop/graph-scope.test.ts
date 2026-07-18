import { describe, expect, it } from "vitest";
import {
  buildDomainOptions,
  domainMatches,
  filterByDomain,
  pickDefaultFocus,
} from "../../desktop/src/panel/graph-scope.js";

const token = (
  slug: string,
  domain: string,
  bloomLevel: number,
  card: object | null = null,
) => ({ slug, domain, bloomLevel, card });

describe("graph-scope buildDomainOptions", () => {
  it("returns distinct domains sorted, skipping empty ones", () => {
    const options = buildDomainOptions([
      { domain: "zam" },
      { domain: "fsrs" },
      { domain: "zam" },
      { domain: "" },
    ]);
    expect(options).toEqual([
      { value: "fsrs", isGroup: false },
      { value: "zam", isGroup: false },
    ]);
  });

  it("adds /-prefix groups and marks them", () => {
    const options = buildDomainOptions([
      { domain: "company-team/ad" },
      { domain: "company-team/boards" },
      { domain: "zam" },
    ]);
    expect(options).toEqual([
      { value: "company-team", isGroup: true },
      { value: "company-team/ad", isGroup: false },
      { value: "company-team/boards", isGroup: false },
      { value: "zam", isGroup: false },
    ]);
  });

  it("does not mark a prefix as group when a token carries it verbatim", () => {
    const options = buildDomainOptions([
      { domain: "company-team" },
      { domain: "company-team/ad" },
    ]);
    expect(options.find((o) => o.value === "company-team")?.isGroup).toBe(
      false,
    );
  });
});

describe("graph-scope domain filtering", () => {
  const tokens = [
    token("a", "company-team/ad", 1),
    token("b", "company-team", 2),
    token("c", "company-teamster", 2),
    token("d", "zam", 1),
  ];

  it("null selects everything", () => {
    expect(filterByDomain(tokens, null)).toHaveLength(4);
  });

  it("matches exact and /-children but not sibling prefixes", () => {
    const filtered = filterByDomain(tokens, "company-team");
    expect(filtered.map((t) => t.slug)).toEqual(["a", "b"]);
    expect(domainMatches("company-teamster", "company-team")).toBe(false);
  });
});

describe("graph-scope pickDefaultFocus", () => {
  it("prefers the lowest-bloom token that has a card", () => {
    const pick = pickDefaultFocus([
      token("high-with-card", "d", 4, { state: "review" }),
      token("low-no-card", "d", 1),
      token("mid-with-card", "d", 2, { state: "new" }),
    ]);
    expect(pick?.slug).toBe("mid-with-card");
  });

  it("falls back to the lowest-bloom token when nothing has a card", () => {
    const pick = pickDefaultFocus([
      token("later", "d", 3),
      token("first", "d", 1),
    ]);
    expect(pick?.slug).toBe("first");
  });

  it("keeps input order on bloom ties and returns null for empty input", () => {
    const pick = pickDefaultFocus([
      token("alpha", "d", 2),
      token("beta", "d", 2),
    ]);
    expect(pick?.slug).toBe("alpha");
    expect(pickDefaultFocus([])).toBeNull();
  });
});
