import { describe, expect, it } from "vitest";
import { webSourceLink } from "../../desktop/src/source-link.js";

const LESSON = "Lektion öffnen ↗";

describe("webSourceLink (ADR 2026-10-19 Decision 6)", () => {
  it("opens only http and https", () => {
    for (const raw of [
      "javascript:alert(1)",
      "file:///etc/passwd",
      "data:text/html,<b>x</b>",
      "src/utils.ts#L12",
      "/Users/me/notes.md",
      "",
      "   ",
      null,
      undefined,
    ]) {
      expect(webSourceLink(raw, LESSON), String(raw)).toBeNull();
    }
    expect(webSourceLink("http://example.org/a", LESSON)?.href).toBe(
      "http://example.org/a",
    );
  });

  it("labels a web page by host and path, with the full URL as title", () => {
    const link = webSourceLink(
      "https://de.wikipedia.org/wiki/Unified_Modeling_Language",
      LESSON,
    );
    expect(link).toEqual({
      href: "https://de.wikipedia.org/wiki/Unified_Modeling_Language",
      label: "de.wikipedia.org/wiki/Unified_Modeling_Language ↗",
      title: "https://de.wikipedia.org/wiki/Unified_Modeling_Language",
      academy: false,
    });
  });

  it("shows an international host in its ASCII form", () => {
    const link = webSourceLink("https://bücher.example/katalog", LESSON);
    expect(link?.label).toBe("xn--bcher-kva.example/katalog ↗");
  });

  it("names an academy lesson as a lesson", () => {
    const link = webSourceLink(
      "https://academy.zam-os.org/uml/#lesson=cls-2-connections",
      LESSON,
    );
    expect(link).toMatchObject({
      label: LESSON,
      title: "https://academy.zam-os.org/uml/#lesson=cls-2-connections",
      academy: true,
    });
  });

  it("does not treat a look-alike host as the academy", () => {
    for (const raw of [
      "https://academy.zam-os.org.evil.example/uml/",
      "https://evil.example/academy.zam-os.org/uml/",
      "https://academy.zam-os.org@evil.example/uml/",
    ]) {
      expect(webSourceLink(raw, LESSON)?.academy, raw).toBe(false);
    }
  });

  it("decodes the path for reading, drops bidi controls and shortens it", () => {
    expect(
      webSourceLink("https://example.org/Gr%C3%BC%C3%9Fe/", LESSON)?.label,
    ).toBe("example.org/Grüße ↗");
    expect(
      webSourceLink("https://example.org/a%E2%80%AEtxt.exe", LESSON)?.label,
    ).toBe("example.org/atxt.exe ↗");
    const long = webSourceLink(
      `https://example.org/${"x".repeat(100)}`,
      LESSON,
    );
    expect(long?.label).toMatch(/^example\.org\/x+…x+ ↗$/);
    expect(long?.label.length).toBeLessThan(80);
    expect(long?.title).toBe(`https://example.org/${"x".repeat(100)}`);
  });
});
