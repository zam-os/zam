import { describe, expect, it } from "vitest";
import { readUpUrl, wikipediaLanguage } from "../../desktop/src/read-up.js";

/** *Nachlesen* (ADR 2026-10-14, Decision 4): the page a click opens. */
describe("readUpUrl", () => {
  it("opens a web source as it is", () => {
    expect(
      readUpUrl({ kind: "source", url: "https://example.org/optik" }, "de"),
    ).toBe("https://example.org/optik");
  });

  it("searches Wikipedia in the learner's language and goes straight to the article", () => {
    expect(
      readUpUrl({ kind: "search", term: "Join (SQL)", language: null }, "de"),
    ).toBe(
      "https://de.wikipedia.org/wiki/Special:Search?search=Join%20(SQL)&go=Go",
    );
  });

  it("takes the unit's language over the learner's and escapes the term", () => {
    expect(
      readUpUrl({ kind: "search", term: "a&b=c #1", language: "pt-BR" }, "de"),
    ).toBe(
      "https://pt.wikipedia.org/wiki/Special:Search?search=a%26b%3Dc%20%231&go=Go",
    );
  });

  it("falls back to English for a locale that names no edition", () => {
    expect(wikipediaLanguage("")).toBe("en");
    expect(wikipediaLanguage("../evil")).toBe("en");
    expect(wikipediaLanguage("zh-Hans")).toBe("zh");
    expect(wikipediaLanguage(null)).toBe("en");
  });
});
