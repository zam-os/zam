import { afterEach, describe, expect, it } from "vitest";
import { setBridgeTransport } from "../../desktop/src/bridge-transport.js";
import { t } from "../../desktop/src/i18n.js";
import {
  appendTopicCards,
  commitTopicStep,
  createOnboardingExit,
  draftSubtopicCards,
  type TopicAreaView,
  TOPIC_TITLE_MAX,
  type TopicImportState,
  topicPlaceArgs,
  topicPromptArgs,
  withTopicPlace,
} from "../../desktop/src/onboarding.js";
import { MAX_TOPIC_TITLE } from "../../src/kernel/index.js";

const TOPICS = ["Pods", "Services", "Deployments"].map((label) => ({
  label,
  description: `Mastering ${label}.`,
}));

function topicState(view: TopicAreaView | null): TopicImportState {
  return {
    place: null,
    title: "Kubernetes",
    context: "",
    path: [],
    levels: [],
    cards: [],
    failedTopics: [],
    busy: null,
    notice: null,
    view,
    sourceId: "src-1",
    imported: null,
  };
}

function liveView(live = { value: true }): TopicAreaView & { renders: number } {
  const view = {
    renders: 0,
    isLive: () => live.value,
    rerender: () => {
      view.renders += 1;
    },
  };
  return view;
}

function topicOf(args: string[]): string {
  return JSON.parse(args[args.indexOf("--topic") + 1]).label;
}

function cardsFor(label: string) {
  return { success: true, proposals: [{ question: `What is ${label}?` }] };
}

afterEach(() => {
  setBridgeTransport(async () => {
    throw new Error("no bridge in tests");
  });
});

describe("draftSubtopicCards", () => {
  it("keeps each topic's own reason and treats an empty answer as one", async () => {
    const progress: string[] = [];
    const state = topicState(liveView());
    setBridgeTransport(async (_cmd, args) => {
      progress.push(state.busy ?? "");
      const topic = topicOf(args);
      if (topic === "Services") {
        throw new Error(
          JSON.stringify({ error: "Claude Code timed out after 300000 ms" }),
        );
      }
      if (topic === "Deployments") return { success: true, proposals: [] };
      return cardsFor(topic);
    });

    await draftSubtopicCards(state, TOPICS);

    expect(progress[1]).toBe("Drafting cards for subtopic 2 of 3: Services…");
    expect(state.cards?.map((card) => card.question)).toEqual([
      "What is Pods?",
    ]);
    expect(state.failedTopics).toEqual([
      {
        ...TOPICS[1],
        error: "Claude Code timed out after 300000 ms",
      },
      { ...TOPICS[2], error: t("topic_subtopic_empty") },
    ]);
    expect(state.busy).toBeNull();
  });

  it("stops before the next subtopic once the topic area is gone", async () => {
    const live = { value: true };
    const state = topicState(liveView(live));
    const asked: string[] = [];
    setBridgeTransport(async (_cmd, args) => {
      asked.push(topicOf(args));
      live.value = false; // the learner left the step during this request
      return cardsFor(topicOf(args));
    });

    await draftSubtopicCards(state, TOPICS);

    expect(asked).toEqual(["Pods"]);
    expect(state.cards?.map((card) => card.question)).toEqual([
      "What is Pods?",
    ]);
    expect(state.failedTopics).toEqual(
      TOPICS.slice(1).map((topic) => ({
        ...topic,
        error: t("topic_subtopic_stopped"),
      })),
    );
    expect(state.busy).toBeNull();
  });

  it("stops once Finish later is clicked, while the page is still shown", async () => {
    const calls: string[] = [];
    let onScreen = true;
    const exit = createOnboardingExit(() => {
      onScreen = false;
    });
    // As renderTopicArea wires it: shown on screen, and not leaving the flow.
    const state = topicState({
      isLive: () => !exit.leaving && onScreen,
      rerender() {},
    });
    let releaseBridge = () => {};
    const bridgeFree = new Promise<void>((resolve) => {
      releaseBridge = resolve;
    });
    let left: Promise<void> | undefined;
    setBridgeTransport(async (cmd, args) => {
      calls.push(cmd === "topic-cards" ? topicOf(args) : cmd);
      if (cmd === "onboarding-complete") {
        // Queued behind the topic in flight on the one desktop bridge.
        await bridgeFree;
        return {};
      }
      left ??= exit.leave(); // Finish later during the first topic
      return cardsFor(topicOf(args));
    });

    await draftSubtopicCards(state, TOPICS);

    expect(onScreen).toBe(true);
    expect(calls).toEqual(["Pods", "onboarding-complete"]);
    expect(state.failedTopics).toEqual(
      TOPICS.slice(1).map((topic) => ({
        ...topic,
        error: t("topic_subtopic_stopped"),
      })),
    );
    releaseBridge();
    await left;
    expect(onScreen).toBe(false);
    expect(exit.leaving).toBe(false);
  });

  it("carries on when the learner comes back while a request runs", async () => {
    const leftBehind = { value: true };
    const state = topicState(liveView(leftBehind));
    const reopened = liveView();
    const asked: string[] = [];
    setBridgeTransport(async (_cmd, args) => {
      asked.push(topicOf(args));
      if (asked.length === 1) {
        leftBehind.value = false;
        state.view = reopened; // the step rendered again
      }
      return cardsFor(topicOf(args));
    });

    await draftSubtopicCards(state, TOPICS);

    expect(asked).toEqual(["Pods", "Services", "Deployments"]);
    expect(state.failedTopics).toEqual([]);
    // Progress and the final state reach the area that is on screen.
    expect(reopened.renders).toBe(3);
  });
});

// Drafted cards live only in the preview until imported, so the footer Next
// must save the ticked ones instead of dropping them.
describe("commitTopicStep", () => {
  function draftedState(): TopicImportState {
    const state = topicState(liveView());
    state.cards = appendTopicCards(
      [],
      [{ question: "What is Pod?" }, { question: "What is Service?" }],
    );
    state.cards[1].selected = false;
    return state;
  }

  it("imports the ticked cards when the learner clicks Next", async () => {
    const state = draftedState();
    const calls: Array<{ cmd: string; args: string[] }> = [];
    setBridgeTransport(async (cmd, args) => {
      calls.push({ cmd, args });
      return { success: true, createdCount: 1, ensuredCount: 0 };
    });

    await expect(commitTopicStep(state)).resolves.toBe(true);

    expect(calls).toHaveLength(1);
    expect(calls[0].cmd).toBe("personal-source-confirm-import");
    expect(calls[0].args).toEqual([
      "--sourceId",
      "src-1",
      "--proposals",
      JSON.stringify([{ question: "What is Pod?" }]),
    ]);
    expect(state.imported).toEqual({ created: 1, ensured: 0 });
  });

  it("records the import once, writing no file, and reuses the record on a retry", async () => {
    const state = draftedState();
    state.sourceId = null;
    const calls: Array<{ cmd: string; args: string[] }> = [];
    let fail = true;
    setBridgeTransport(async (cmd, args) => {
      calls.push({ cmd, args });
      if (cmd === "topic-source") return { success: true, sourceId: "src-9" };
      if (fail) {
        fail = false;
        throw new Error("busy");
      }
      return { success: true, createdCount: 1, ensuredCount: 0 };
    });

    await expect(commitTopicStep(state)).resolves.toBe(false);
    await expect(commitTopicStep(state)).resolves.toBe(true);

    expect(calls.map((call) => call.cmd)).toEqual([
      "topic-source",
      "personal-source-confirm-import",
      "personal-source-confirm-import",
    ]);
    expect(calls[0].args).toEqual(["--title", "Kubernetes"]);
    expect(calls[2].args.slice(0, 2)).toEqual(["--sourceId", "src-9"]);
  });

  it("keeps a placement error beside the counts, so the learner sees it", async () => {
    const state = draftedState();
    state.place = {
      lens: "weltwissen",
      regionKey: "natur.physik.optik",
      path: ["Natur", "Physik", "Licht & Wellen"],
    };
    setBridgeTransport(async () => ({
      success: true,
      createdCount: 1,
      ensuredCount: 0,
      placed: 0,
      placeError: 'No region "natur.physik.optik" in the Weltwissen lens.',
    }));

    await expect(commitTopicStep(state)).resolves.toBe(true);

    expect(state.imported).toEqual({
      created: 1,
      ensured: 0,
      placeError: 'No region "natur.physik.optik" in the Weltwissen lens.',
    });
  });

  it("does not import twice or when nothing was drafted", async () => {
    const asked: string[] = [];
    setBridgeTransport(async (cmd) => {
      asked.push(cmd);
      return { success: true, createdCount: 1, ensuredCount: 0 };
    });

    const imported = draftedState();
    imported.imported = { created: 1, ensured: 0 };
    const empty = topicState(liveView());
    empty.cards = null;

    await expect(commitTopicStep(imported)).resolves.toBe(true);
    await expect(commitTopicStep(empty)).resolves.toBe(true);
    expect(asked).toEqual([]);
  });

  it("stays on the step and says why when the import fails", async () => {
    const view = liveView();
    const state = draftedState();
    state.view = view;
    setBridgeTransport(async () => {
      throw new Error(JSON.stringify({ error: "library is read-only" }));
    });

    await expect(commitTopicStep(state)).resolves.toBe(false);

    expect(state.notice).toBe(
      t("topic_error").replace("{message}", "library is read-only"),
    );
    expect(state.imported).toBeNull();
    expect(view.renders).toBe(1);
  });
});

// The topic import drafts cards one subtopic at a time; neighbouring ones can
// propose the same card, which the preview must show once.
describe("appendTopicCards", () => {
  it("appends each topic's proposals as selected preview cards", () => {
    const first = appendTopicCards(
      [],
      [{ question: "What is a barre chord?", concept: "A chord fretted..." }],
    );
    const both = appendTopicCards(first, [
      { question: "Name the open chords.", concept: "C, A, G, E, D" },
    ]);

    expect(both.map((card) => card.question)).toEqual([
      "What is a barre chord?",
      "Name the open chords.",
    ]);
    expect(both.every((card) => card.selected)).toBe(true);
    expect(both[1].proposal).toMatchObject({ concept: "C, A, G, E, D" });
  });

  it("skips a card another topic already drafted", () => {
    const first = appendTopicCards(
      [],
      [
        {
          question: "What is a barre chord?",
          concept: "One finger, all frets",
        },
      ],
    );
    const again = appendTopicCards(first, [
      {
        question: " what is a BARRE chord? ",
        concept: "one finger, all frets",
      },
      { question: "What is a capo?", concept: "A clamp" },
    ]);

    expect(again.map((card) => card.question)).toEqual([
      "What is a barre chord?",
      "What is a capo?",
    ]);
  });
});

describe("the topic's name", () => {
  it("has the length limit of the import's record", () => {
    expect(TOPIC_TITLE_MAX).toBe(MAX_TOPIC_TITLE);
  });
});

describe("a topic import at an atlas place (ADR 2026-10-13, Decision 9)", () => {
  const place = {
    lens: "weltwissen" as const,
    regionKey: "natur.physik.optik",
    path: ["Natur", "Physik", "Licht & Wellen"],
  };

  it("tells the model the place apart from the context, and the confirm where to put the cards", () => {
    const state = { ...topicState(null), place, context: " Für die Probe. " };
    expect(topicPromptArgs(state)).toEqual([
      "--context",
      "Für die Probe.",
      "--place",
      JSON.stringify(["Natur", "Physik", "Licht & Wellen"]),
    ]);
    expect(topicPlaceArgs(state)).toEqual([
      "--place-region",
      "natur.physik.optik",
      "--place-lens",
      "weltwissen",
    ]);
    const drafted = withTopicPlace(state, TOPICS[0], [{ question: "Q" }]);
    expect(drafted[0].placeBelow).toEqual(["Kubernetes", "Pods"]);
  });

  it("changes nothing without a place", () => {
    const state = { ...topicState(null), context: " Warum " };
    expect(topicPromptArgs(state)).toEqual([
      "--context",
      "Warum",
      "--place",
      "[]",
    ]);
    expect(topicPlaceArgs(state)).toEqual([]);
    expect(withTopicPlace(state, TOPICS[0], [{ question: "Q" }])).toEqual([
      { question: "Q" },
    ]);
  });
});
