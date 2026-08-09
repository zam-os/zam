import { describe, expect, it, vi } from "vitest";
import {
  buildTranslatePrompt,
  NoTranslationBackendError,
  parseTranslation,
  statusFromFailures,
  translateCard,
  TranslationFailedError,
} from "../../mobile/src/ai/translate.js";
import type { ZamPairLlmEndpoint } from "../../src/bridge/mobile-pairing.js";
import type { Database } from "../../src/kernel/db/types.js";

const db = {} as Database;

const card = {
  question: "What does a prerequisite block?",
  concept: "A card whose prerequisite is unlearned stays out of the queue.",
};

function endpoint(
  overrides: Partial<ZamPairLlmEndpoint> = {},
): ZamPairLlmEndpoint {
  return {
    enabled: true,
    url: "https://api.example.com/v1",
    model: "cheap-chat",
    apiFlavor: "chat-completions",
    local: false,
    apiKey: "secret",
    label: "Cloud",
    ...overrides,
  };
}

const good = JSON.stringify({
  question: "Was blockiert eine Voraussetzung?",
  concept: "Eine Karte mit ungelernter Voraussetzung bleibt aus der Queue.",
});

describe("buildTranslatePrompt", () => {
  it("names the target language and carries both fields", () => {
    const prompt = buildTranslatePrompt(card, "de");
    expect(prompt).toContain("into German");
    expect(prompt).toContain(card.question);
    expect(prompt).toContain(card.concept);
  });

  it("forbids answering the question", () => {
    // A model asked to "translate a flashcard" will otherwise helpfully
    // answer it, and the answer lands in the question field.
    expect(buildTranslatePrompt(card, "en")).toMatch(
      /Do not answer the question/,
    );
  });

  it("falls back to English for a language it has no name for", () => {
    expect(buildTranslatePrompt(card, "sv")).toContain("into English");
  });
});

describe("parseTranslation", () => {
  it("reads the two fields", () => {
    const result = parseTranslation(good);
    expect(result.question).toBe("Was blockiert eine Voraussetzung?");
  });

  it("survives a markdown fence, which models add unasked", () => {
    expect(parseTranslation(`\`\`\`json\n${good}\n\`\`\``).concept).toContain(
      "Voraussetzung",
    );
  });

  it("refuses a reply it cannot read rather than guessing", () => {
    expect(() => parseTranslation("Sure! Here you go:")).toThrow(/valid JSON/);
    expect(() => parseTranslation('{"question": "only one"}')).toThrow(
      /missing question or concept/,
    );
  });
});

describe("translateCard", () => {
  it("says what is missing when no model is connected", async () => {
    await expect(
      translateCard(db, card, "de", {}, async () => null),
    ).rejects.toBeInstanceOf(NoTranslationBackendError);
  });

  it("posts the prompt to the resolved endpoint", async () => {
    const fetchText = vi.fn(async () => good);
    const result = await translateCard(
      db,
      card,
      "de",
      { fetchText },
      async () => endpoint(),
    );
    expect(result.question).toBe("Was blockiert eine Voraussetzung?");
    const [url, init] = fetchText.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/v1/chat/completions");
    expect(String(init.body)).toContain("into German");
  });

  it("follows the fallback chain rather than ending on the first failure", async () => {
    // Someone who configured a second endpoint expects it to catch the first
    // one's outage — the same promise evaluation makes.
    const fetchText = vi.fn(async (url: string) => {
      if (url.startsWith("https://first")) throw new Error("HTTP 429");
      return good;
    });
    const chain = endpoint({ url: "https://first.example.com/v1" });
    chain.fallback = endpoint({ url: "https://second.example.com/v1" });
    const result = await translateCard(
      db,
      card,
      "de",
      { fetchText },
      async () => chain,
    );
    expect(result.concept).toContain("Voraussetzung");
    expect(fetchText).toHaveBeenCalledTimes(2);
  });

  it("reports every endpoint that failed when none worked", async () => {
    const fetchText = vi.fn(async () => {
      throw new Error("HTTP 500");
    });
    await expect(
      translateCard(db, card, "de", { fetchText }, async () => endpoint()),
    ).rejects.toThrow(/Cloud: HTTP 500/);
  });

  it("carries the status, so the screen can name a rejected key", async () => {
    // 401 and 429 are the only two failures a learner can do anything about;
    // everything else is "try again". Without the status the screen would
    // paste provider JSON at them instead.
    const fetchText = vi.fn(async () => {
      throw new Error('HTTP 401: {"error":{"message":"…","code":401}}');
    });
    const failure = await translateCard(
      db,
      card,
      "de",
      { fetchText },
      async () => endpoint(),
    ).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(TranslationFailedError);
    expect((failure as TranslationFailedError).status).toBe(401);
  });
});

describe("statusFromFailures", () => {
  it("finds the code and shrugs when there is none", () => {
    expect(statusFromFailures("Cloud: HTTP 429: slow down")).toBe(429);
    expect(statusFromFailures("Cloud: network unreachable")).toBeUndefined();
  });
});
