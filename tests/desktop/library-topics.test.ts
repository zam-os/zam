import { afterEach, describe, expect, it } from "vitest";
import { setBridgeTransport } from "../../desktop/src/bridge-transport.js";
import { setCurrentLocale, t } from "../../desktop/src/i18n.js";
import {
  fetchLibraryTopics,
  type LibraryTopicRow,
  missingCount,
  startLibraryTopic,
  startResultText,
  topicActionLabel,
  topicMetaText,
  topicsErrorText,
} from "../../desktop/src/library-topics.js";

/** ADR 2026-10-02: the Studio side of library topics. */

function topic(overrides: Partial<LibraryTopicRow> = {}): LibraryTopicRow {
  return {
    key: "https://hub.example.org/okf/rest-api.md",
    name: "Rest api",
    domain: "api",
    itemCount: 5,
    heldCount: 0,
    setAsideCount: 0,
    ...overrides,
  };
}

afterEach(() => {
  setCurrentLocale("en");
  setBridgeTransport(async () => {
    throw new Error("no transport in this test");
  });
});

describe("library topic rows", () => {
  it("offers Start for an untouched topic", () => {
    expect(topicActionLabel(topic())).toBe(t("library_topics_start"));
    expect(missingCount(topic())).toBe(5);
  });

  it("offers only the missing cards once started, and nothing when complete", () => {
    const partly = topic({ heldCount: 2, setAsideCount: 1 });
    expect(missingCount(partly)).toBe(2);
    expect(topicActionLabel(partly)).toBe("Add 2 new cards");
    expect(topicActionLabel(topic({ heldCount: 4, setAsideCount: 1 }))).toBe(
      null,
    );
  });

  it("describes coverage with the learner's own numbers", () => {
    expect(topicMetaText(topic({ heldCount: 3 }))).toBe(
      "api · 5 cards · you have 3",
    );
    expect(
      topicMetaText(topic({ domain: null, heldCount: 3, setAsideCount: 2 })),
    ).toBe("5 cards · you have 3 · 2 set aside");
  });

  it("reports a start, including one that added nothing", () => {
    const base = {
      key: "k",
      name: "Rest api",
      itemCount: 5,
      alreadyHeld: 0,
      setAside: 0,
    };
    expect(startResultText({ ...base, created: 5 })).toBe(
      "Rest api: 5 cards added — they join your reviews over the next days.",
    );
    expect(startResultText({ ...base, created: 0, alreadyHeld: 5 })).toBe(
      "Rest api: you already have every card.",
    );
  });

  it("does not repeat the error prefix as the reason", () => {
    expect(topicsErrorText(new Error(t("library_topics_error")))).toBe(
      t("library_topics_error"),
    );
    expect(topicsErrorText(new Error("connection reset"))).toBe(
      `${t("library_topics_error")}: connection reset`,
    );
    expect(
      topicsErrorText(new Error("gone"), "library_topics_start_error"),
    ).toBe(`${t("library_topics_start_error")}: gone`);
  });
});

describe("library topic bridge calls", () => {
  it("lists topics and starts one with its key", async () => {
    const calls: Array<{ cmd: string; args: string[] }> = [];
    setBridgeTransport(async (cmd, args) => {
      calls.push({ cmd, args });
      if (cmd === "library-topics-list") {
        return { success: true, topics: [topic()] };
      }
      return {
        success: true,
        key: args[1],
        name: "Rest api",
        itemCount: 5,
        created: 5,
        alreadyHeld: 0,
        setAside: 0,
      };
    });

    expect(await fetchLibraryTopics()).toEqual([topic()]);
    const result = await startLibraryTopic(topic().key);
    expect(result.created).toBe(5);
    expect(calls).toEqual([
      { cmd: "library-topics-list", args: [] },
      { cmd: "library-topic-start", args: ["--key", topic().key] },
    ]);
  });

  it("turns a payload without success into an error", async () => {
    // The desktop transport answers an empty stdout with `{}`.
    setBridgeTransport(async () => ({}));
    await expect(fetchLibraryTopics()).rejects.toThrow(
      t("library_topics_error"),
    );
  });
});
