import { describe, expect, it, vi } from "vitest";
import { academyPracticeLink } from "../../desktop/src/source-link.js";
import { submitRatingCommand } from "../../desktop/src/study-card-actions.js";
import { createPausedStudySession } from "../../desktop/src/study-session-resume.js";
import { desktopMainFunctions } from "../helpers/desktop-main.js";

function element() {
  const classes = new Set<string>();
  return {
    disabled: false,
    hidden: false,
    textContent: "",
    value: "",
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
      contains: (name: string) => classes.has(name),
      toggle: (name: string, force: boolean) =>
        force ? classes.add(name) : classes.delete(name),
    },
  };
}

function runtime(names: string[], globals: Record<string, unknown> = {}) {
  const elements = new Map(
    [
      "content-study-resume-banner",
      "lbl-content-resume-status",
      "btn-content-resume-session",
      "btn-start-session",
      "database-user-select",
      "setup-status",
      "revealed-box",
    ].map((id) => [id, element()]),
  );
  const context = desktopMainFunctions(names, {
    document: { getElementById: (id: string) => elements.get(id) ?? null },
    window: { confirm: vi.fn(() => true) },
    console: { warn: vi.fn(), error: vi.fn() },
    t: (key: string) => key,
    tf: (key: string) => key,
    pausedStudySession: null,
    resumeSessionInFlight: false,
    dueSummaryLoaded: true,
    dueCardCount: 0,
    totalDue: 0,
    ...globals,
  });
  return { context, elements };
}

function snapshot() {
  return {
    sessionId: "alice-session",
    startedDue: 9,
    cardsReviewed: 4,
    cardsRemaining: 6,
    newRemaining: 2,
    extraNewRemaining: 0,
    choiceReady: 0,
    bonusIgnored: false,
    ratings: { 1: 0, 2: 0, 3: 4, 4: 0 },
    done: 4,
    assessedAtoms: ["assessed-atom"],
    atlasRegion: null,
  };
}

describe("Desktop Start / Resume availability", () => {
  it.each([
    {
      dueCardCount: 3,
      totalDue: 0,
      paused: false,
      inFlight: false,
      disabled: false,
    },
    {
      dueCardCount: 0,
      totalDue: 0,
      paused: false,
      inFlight: false,
      disabled: true,
    },
    {
      dueCardCount: 3,
      totalDue: 2,
      paused: false,
      inFlight: false,
      disabled: false,
    },
    {
      dueCardCount: 0,
      totalDue: 0,
      paused: true,
      inFlight: false,
      disabled: false,
    },
    {
      dueCardCount: 3,
      totalDue: 2,
      paused: true,
      inFlight: true,
      disabled: true,
    },
  ])(
    "keeps the due-card rule for $dueCardCount due / $totalDue offered (paused=$paused)",
    (state) => {
      const { context, elements } = runtime(["syncPausedSessionUi"], {
        dueCardCount: state.dueCardCount,
        totalDue: state.totalDue,
        pausedStudySession: state.paused ? snapshot() : null,
        resumeSessionInFlight: state.inFlight,
      });

      context.syncPausedSessionUi();

      expect(elements.get("btn-start-session")?.disabled).toBe(state.disabled);
      expect(elements.get("btn-start-session")?.textContent).toBe(
        state.paused ? "btn_resume_session" : "btn_start_session",
      );
      expect(elements.get("content-study-resume-banner")?.hidden).toBe(
        !state.paused,
      );
    },
  );

  it("restores normal Start availability after discarding a paused session", async () => {
    const { context, elements } = runtime(
      ["syncPausedSessionUi", "discardPausedStudySession"],
      {
        pausedStudySession: snapshot(),
        zamUiSessionId: null,
        dueCardCount: 3,
        totalDue: 0,
        runBridge: vi.fn().mockResolvedValue({}),
      },
    );

    context.syncPausedSessionUi();
    await context.discardPausedStudySession();

    expect(elements.get("btn-start-session")?.disabled).toBe(false);
    expect(elements.get("btn-start-session")?.textContent).toBe(
      "btn_start_session",
    );
    expect(elements.get("content-study-resume-banner")?.hidden).toBe(true);
  });
});

function profileRuntime() {
  let backendUser = "alice";
  const calls: Array<{ cmd: string; user: string }> = [];
  const runBridge = vi.fn(async (cmd: string) => {
    calls.push({ cmd, user: backendUser });
    if (cmd === "database-select-user") {
      backendUser = "bob";
      return { success: true, userId: "bob", cardCount: 1 };
    }
    return {};
  });
  const result = runtime(
    [
      "selectDatabaseUser",
      "discardPausedStudySession",
      "syncPausedSessionUi",
      "resumeStudySession",
    ],
    {
      pausedStudySession: snapshot(),
      desktopUserId: "alice",
      databaseCurrentUserId: "alice",
      zamUiSessionId: null,
      currentStudyLearningSettings: {},
      DEFAULT_STUDY_LEARNING_SETTINGS: {},
      studyLearningFallbackMode: () => "flash",
      renderStudyLearningSettings: vi.fn(),
      loadDatabaseStatus: vi.fn(),
      loadStudyLearningSettings: vi.fn().mockResolvedValue(true),
      loadDashboard: vi.fn(),
      updateGraphLearnerFilterUi: vi.fn(),
      prepareStudyViewForSession: vi.fn(),
      ensureUiLearningSession: vi.fn().mockResolvedValue("alice-session"),
      sessionStartedDue: 0,
      cardsReviewedThisSession: 0,
      sessionCardsRemaining: 0,
      sessionNewRemaining: 0,
      sessionExtraNewRemaining: 0,
      sessionChoiceReady: 0,
      bonusIgnoredThisSession: false,
      studyAtlasRegion: null,
      sessionRatingTally: { done: 0, ratings: {} },
      assessedAtomsThisSession: new Set(),
      switchView: vi.fn(),
      loadNextCard: vi.fn(),
      runBridge,
    },
  );
  return { ...result, calls, runBridge };
}

describe("Desktop paused sessions and profiles", () => {
  it("ends the paused session under the outgoing profile before switching", async () => {
    const { context, elements, calls, runBridge } = profileRuntime();

    await context.selectDatabaseUser("bob");
    await context.resumeStudySession();

    expect(calls).toEqual([
      { cmd: "end-session", user: "alice" },
      { cmd: "database-select-user", user: "alice" },
    ]);
    expect(runBridge).toHaveBeenCalledWith("end-session", [
      "--session",
      "alice-session",
    ]);
    expect(context.pausedStudySession).toBeNull();
    expect(context.desktopUserId).toBe("bob");
    expect(context.ensureUiLearningSession).not.toHaveBeenCalled();
    expect(context.loadNextCard).not.toHaveBeenCalled();
    expect(elements.get("content-study-resume-banner")?.hidden).toBe(true);
  });

  it("keeps the paused session if the learner cancels the profile switch", async () => {
    const { context, calls } = profileRuntime();
    context.window.confirm.mockReturnValue(false);

    await context.selectDatabaseUser("bob");

    expect(calls).toEqual([]);
    expect(context.pausedStudySession?.sessionId).toBe("alice-session");
    expect(context.desktopUserId).toBe("alice");
  });

  it("does not finish an in-flight resume after the profile switch discards it", async () => {
    const { context } = profileRuntime();
    let resolveSettings!: () => void;
    context.loadStudyLearningSettings.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSettings = resolve;
        }),
    );

    const resuming = context.resumeStudySession();
    await context.selectDatabaseUser("bob");
    resolveSettings();
    await resuming;

    expect(context.pausedStudySession).toBeNull();
    expect(context.zamUiSessionId).toBeNull();
    expect(context.ensureUiLearningSession).not.toHaveBeenCalled();
    expect(context.switchView).not.toHaveBeenCalled();
    expect(context.loadNextCard).not.toHaveBeenCalled();
    expect(context.resumeSessionInFlight).toBe(false);
  });

  it("clears the restored session ID if switching profiles during session setup", async () => {
    const { context } = profileRuntime();
    let resolveSession!: (id: string) => void;
    let notifySessionStarted!: () => void;
    const sessionStarted = new Promise<void>((resolve) => {
      notifySessionStarted = resolve;
    });
    context.ensureUiLearningSession.mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          resolveSession = resolve;
          notifySessionStarted();
        }),
    );

    const resuming = context.resumeStudySession();
    await sessionStarted;
    expect(context.zamUiSessionId).toBe("alice-session");
    await context.selectDatabaseUser("bob");
    resolveSession("alice-session");
    await resuming;

    expect(context.pausedStudySession).toBeNull();
    expect(context.zamUiSessionId).toBeNull();
    expect(context.switchView).not.toHaveBeenCalled();
    expect(context.loadNextCard).not.toHaveBeenCalled();
  });

  it("does not revive a discarded snapshot when the pending resume fails", async () => {
    const { context } = profileRuntime();
    let rejectSettings!: (error: Error) => void;
    context.loadStudyLearningSettings.mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectSettings = reject;
        }),
    );

    const resuming = context.resumeStudySession();
    await context.selectDatabaseUser("bob");
    rejectSettings(new Error("Settings failed"));
    await resuming;

    expect(context.pausedStudySession).toBeNull();
    expect(context.zamUiSessionId).toBeNull();
    expect(context.loadNextCard).not.toHaveBeenCalled();
    expect(context.resumeSessionInFlight).toBe(false);
  });

  it("restores the same learner's snapshot and loads the next card", async () => {
    const { context } = profileRuntime();

    await context.resumeStudySession();

    expect(context.zamUiSessionId).toBe("alice-session");
    expect(context.sessionRatingTally.done).toBe(4);
    expect(context.sessionCardsRemaining).toBe(6);
    expect(context.sessionNewRemaining).toBe(2);
    expect([...context.assessedAtomsThisSession]).toEqual(["assessed-atom"]);
    expect(context.pausedStudySession).toBeNull();
    expect(context.switchView).toHaveBeenCalledWith("study-view");
    expect(context.loadNextCard).toHaveBeenCalledOnce();
  });
});

function ratingRuntime(budget: "new" | "extra_new" | "none") {
  return runtime(
    ["submitRating", "pauseCurrentStudySession", "jumpToFullEditor"],
    {
      activeCard: {
        cardId: "card-1",
        slug: "academy-card",
        sourceLink: "https://academy.zam-os.org/lesson",
      },
      activeAttemptId: "attempt-1",
      activeAnswerFormat: "recall",
      activeCardRated: false,
      activeCardConsumedReview: true,
      activeCardNewBudget: budget,
      reviewActionInProgress: false,
      cardLoadInProgress: false,
      isStudyConfirmOpen: () => false,
      isStudyInlineEditorOpen: () => false,
      beginReviewAction: () => true,
      endReviewAction: vi.fn(),
      learningClock: { elapsedMs: () => 100 },
      voiceController: { active: false },
      resetDiscussionUi: vi.fn(),
      showStudyBusy: vi.fn(),
      hideStudyBusy: vi.fn(),
      currentStudyLearningSettings: { learningMode: "flash" },
      academyPracticeLink,
      submitRatingCommand,
      runBridge: vi.fn().mockResolvedValue({}),
      showAcademyPracticeOffer: vi.fn(),
      studySessionActive: true,
      zamUiSessionId: "session-1",
      sessionStartedDue: 1,
      cardsReviewedThisSession: 1,
      sessionCardsRemaining: 0,
      sessionNewRemaining: 0,
      sessionExtraNewRemaining: 0,
      sessionChoiceReady: 0,
      bonusIgnoredThisSession: false,
      sessionRatingTally: { done: 0, ratings: { 1: 0, 2: 0, 3: 0, 4: 0 } },
      assessedAtomsThisSession: new Set(),
      studyAtlasRegion: null,
      createPausedStudySession,
      teardownActiveStudyUi: vi.fn(),
      syncPausedSessionUi: vi.fn(),
      closeManageMenu: vi.fn(),
      switchView: vi.fn(),
      openCardInEditor: vi.fn().mockResolvedValue(true),
    },
  );
}

describe("Desktop pause after an Academy rating", () => {
  it.each(["new", "extra_new", "none"] as const)(
    "does not refund a rated card's %s budget slot",
    async (budget) => {
      const { context } = ratingRuntime(budget);

      await context.submitRating(1);
      expect(context.showAcademyPracticeOffer).toHaveBeenCalledOnce();
      expect(context.activeCard).not.toBeNull();
      await context.jumpToFullEditor();

      expect(context.pausedStudySession).toMatchObject({
        done: 1,
        cardsReviewed: 1,
        cardsRemaining: 0,
        newRemaining: 0,
        extraNewRemaining: 0,
      });
    },
  );

  it("still refunds the active card's slots if rating submission failed", async () => {
    const { context } = ratingRuntime("new");
    context.runBridge.mockRejectedValueOnce(new Error("Save failed"));

    await context.submitRating(1);
    await context.jumpToFullEditor();

    expect(context.showAcademyPracticeOffer).not.toHaveBeenCalled();
    expect(context.pausedStudySession).toMatchObject({
      done: 0,
      cardsReviewed: 0,
      cardsRemaining: 1,
      newRemaining: 1,
    });
  });
});
