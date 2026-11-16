import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type EditorCardCandidate,
  type EditorSegment,
  locateCardForEditor,
} from "../../desktop/src/editor-card-selection.js";

interface FakeCard extends EditorCardCandidate {
  context: string;
  segment: EditorSegment;
  title: string;
}

function makeFakeHost(
  cards: FakeCard[],
  initial: {
    context?: string;
    segment?: EditorSegment;
    search?: string;
    category?: string;
  } = {},
) {
  let segment: EditorSegment = initial.segment ?? "personal";
  let context = initial.context ?? "";
  let search = initial.search ?? "stale search";
  let category = initial.category ?? "stale category";
  const calls: string[] = [];

  return {
    state: () => ({ segment, context, search, category, calls }),
    host: {
      getContext: () => context,
      setSegment: (next: EditorSegment) => {
        segment = next;
        calls.push(`segment:${next}`);
      },
      clearSearchAndCategory: () => {
        search = "";
        category = "";
        calls.push("clearSearchAndCategory");
      },
      clearContext: () => {
        context = "";
        calls.push("clearContext");
      },
      loadCards: async () => {
        calls.push(`load:${segment}:${context}`);
        return cards.filter(
          (card) =>
            card.segment === segment &&
            (segment !== "personal" || !context || card.context === context) &&
            (!search || card.title.includes(search)) &&
            (!category || card.title.includes(category)),
        );
      },
    },
  };
}

describe("locateCardForEditor", () => {
  it("clears search and category filters and finds a card in the active context", async () => {
    const target: FakeCard = {
      slug: "quote-paraphrase-online",
      context: "ctx-de",
      segment: "personal",
      title: "Lesen",
    };
    const fake = makeFakeHost([target], {
      context: "ctx-de",
      segment: "unpublished",
      search: "unrelated",
      category: "old-cat",
    });

    const found = await locateCardForEditor(target.slug, fake.host);

    expect(found).toEqual(target);
    expect(fake.state()).toEqual({
      segment: "personal",
      context: "ctx-de",
      search: "",
      category: "",
      calls: [
        "clearSearchAndCategory",
        "segment:personal",
        "load:personal:ctx-de",
      ],
    });
  });

  it("widens a scoped knowledge context to all contexts before trying unpublished", async () => {
    const target: FakeCard = {
      slug: "quote-paraphrase-online",
      context: "ctx-school",
      segment: "personal",
      title: "Lesen",
    };
    const fake = makeFakeHost([target], {
      context: "ctx-work",
      segment: "personal",
    });

    const found = await locateCardForEditor(target.slug, fake.host);

    expect(found).toEqual(target);
    expect(fake.state().segment).toBe("personal");
    expect(fake.state().context).toBe("");
    expect(fake.state().calls).toEqual([
      "clearSearchAndCategory",
      "segment:personal",
      "load:personal:ctx-work",
      "clearContext",
      "load:personal:",
    ]);
  });

  it("falls back to unpublished when the card is a draft in any context", async () => {
    const draft: FakeCard = {
      slug: "draft-card",
      context: "ctx-school",
      segment: "unpublished",
      title: "Draft",
    };
    const fake = makeFakeHost([draft], {
      context: "ctx-work",
      segment: "personal",
    });

    const found = await locateCardForEditor(draft.slug, fake.host);

    expect(found).toEqual(draft);
    expect(fake.state().segment).toBe("unpublished");
    expect(fake.state().calls).toEqual([
      "clearSearchAndCategory",
      "segment:personal",
      "load:personal:ctx-work",
      "clearContext",
      "load:personal:",
      "segment:unpublished",
      "load:unpublished:",
    ]);
  });

  it("restores personal and returns null when the card is absent everywhere", async () => {
    const fake = makeFakeHost([], {
      context: "",
      segment: "personal",
    });

    const found = await locateCardForEditor("missing-slug", fake.host);

    expect(found).toBeNull();
    expect(fake.state().segment).toBe("personal");
    expect(fake.state().calls).toEqual([
      "clearSearchAndCategory",
      "segment:personal",
      "load:personal:",
      "segment:unpublished",
      "load:unpublished:",
      "segment:personal",
      "load:personal:",
    ]);
  });
});

describe("Learning Content openCardInEditor wiring", () => {
  const source = readFileSync(
    resolve(process.cwd(), "desktop/src/learning-content.ts"),
    "utf8",
  );

  it("awaits context filter initialization and guards stale opens", () => {
    expect(source).toContain("contextFilterInitPromise");
    expect(source).toContain("openEditorGeneration");
    expect(source).toContain("await contextFilterInitPromise;");
    expect(source).toContain("await locateCardForEditor(slug,");
    expect(source).toContain("clearSearchAndCategory");
    expect(source).toContain("clearContext");
  });

  it("scrolls the newly selected card row into view in the card list", () => {
    expect(source).toContain('scrollIntoView({ block: "nearest" })');
  });
});
