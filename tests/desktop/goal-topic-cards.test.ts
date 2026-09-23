import { afterEach, describe, expect, it } from "vitest";
import { setBridgeTransport } from "../../desktop/src/bridge-transport.js";
import { t } from "../../desktop/src/i18n.js";
import {
  appendGoalCards,
  createOnboardingExit,
  draftGoalTopicCards,
  type GoalAreaView,
  type GoalImportState,
} from "../../desktop/src/onboarding.js";

const TOPICS = ["Pods", "Services", "Deployments"].map((label) => ({
  label,
  description: `Mastering ${label}.`,
}));

function goalState(view: GoalAreaView | null): GoalImportState {
  return {
    title: "Kubernetes",
    description: "",
    path: [],
    levels: [],
    cards: [],
    failedTopics: [],
    busy: null,
    notice: null,
    view,
    sourceId: "src-1",
    goalFile: { slug: "kubernetes", filePath: "C:/goals/kubernetes.md" },
    imported: null,
  };
}

function liveView(live = { value: true }): GoalAreaView & { renders: number } {
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

describe("draftGoalTopicCards", () => {
  it("keeps each topic's own reason and treats an empty answer as one", async () => {
    const progress: string[] = [];
    const state = goalState(liveView());
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

    await draftGoalTopicCards(state, TOPICS, "C:/goals/kubernetes.md");

    expect(progress[1]).toBe("Drafting cards for topic 2 of 3: Services…");
    expect(state.cards?.map((card) => card.question)).toEqual([
      "What is Pods?",
    ]);
    expect(state.failedTopics).toEqual([
      {
        ...TOPICS[1],
        error: "Claude Code timed out after 300000 ms",
      },
      { ...TOPICS[2], error: t("onboarding_goal_topic_empty") },
    ]);
    expect(state.busy).toBeNull();
  });

  it("stops before the next topic once the goal area is gone", async () => {
    const live = { value: true };
    const state = goalState(liveView(live));
    const asked: string[] = [];
    setBridgeTransport(async (_cmd, args) => {
      asked.push(topicOf(args));
      live.value = false; // the learner left the step during this request
      return cardsFor(topicOf(args));
    });

    await draftGoalTopicCards(state, TOPICS, "C:/goals/kubernetes.md");

    expect(asked).toEqual(["Pods"]);
    expect(state.cards?.map((card) => card.question)).toEqual([
      "What is Pods?",
    ]);
    expect(state.failedTopics).toEqual(
      TOPICS.slice(1).map((topic) => ({
        ...topic,
        error: t("onboarding_goal_topic_stopped"),
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
    // As renderGoalArea wires it: shown on screen, and not leaving the flow.
    const state = goalState({
      isLive: () => !exit.leaving && onScreen,
      rerender() {},
    });
    let releaseBridge = () => {};
    const bridgeFree = new Promise<void>((resolve) => {
      releaseBridge = resolve;
    });
    let left: Promise<void> | undefined;
    setBridgeTransport(async (cmd, args) => {
      calls.push(cmd === "goal-topic-cards" ? topicOf(args) : cmd);
      if (cmd === "onboarding-complete") {
        // Queued behind the topic in flight on the one desktop bridge.
        await bridgeFree;
        return {};
      }
      left ??= exit.leave(); // Finish later during the first topic
      return cardsFor(topicOf(args));
    });

    await draftGoalTopicCards(state, TOPICS, "C:/goals/kubernetes.md");

    expect(onScreen).toBe(true);
    expect(calls).toEqual(["Pods", "onboarding-complete"]);
    expect(state.failedTopics).toEqual(
      TOPICS.slice(1).map((topic) => ({
        ...topic,
        error: t("onboarding_goal_topic_stopped"),
      })),
    );
    releaseBridge();
    await left;
    expect(onScreen).toBe(false);
    expect(exit.leaving).toBe(false);
  });

  it("carries on when the learner comes back while a request runs", async () => {
    const leftBehind = { value: true };
    const state = goalState(liveView(leftBehind));
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

    await draftGoalTopicCards(state, TOPICS, "C:/goals/kubernetes.md");

    expect(asked).toEqual(["Pods", "Services", "Deployments"]);
    expect(state.failedTopics).toEqual([]);
    // Progress and the final state reach the area that is on screen.
    expect(reopened.renders).toBe(3);
  });
});

// The goal flow drafts cards one topic at a time; neighbouring topics can
// propose the same card, which the preview must show once.
describe("appendGoalCards", () => {
  it("appends each topic's proposals as selected preview cards", () => {
    const first = appendGoalCards(
      [],
      [{ question: "What is a barre chord?", concept: "A chord fretted..." }],
    );
    const both = appendGoalCards(first, [
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
    const first = appendGoalCards(
      [],
      [
        {
          question: "What is a barre chord?",
          concept: "One finger, all frets",
        },
      ],
    );
    const again = appendGoalCards(first, [
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
