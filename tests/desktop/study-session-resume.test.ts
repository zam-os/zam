import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES, setCurrentLocale, t } from "../../desktop/src/i18n.js";
import { createPausedStudySession } from "../../desktop/src/study-session-resume.js";

describe("createPausedStudySession", () => {
  it("rolls back the unrated active card review and regular new-card slots", () => {
    const baseRatings: Record<1 | 2 | 3 | 4, number> = {
      1: 0,
      2: 0,
      3: 1,
      4: 0,
    };
    const assessed = ["atom-1"];
    const region = {
      lens: "domain",
      key: "deutsch",
      practise: 3,
      practiceSince: "2026-11-15T19:00:00.000Z",
    };

    const snapshot = createPausedStudySession({
      sessionId: "01JABC",
      startedDue: 37,
      cardsReviewed: 2,
      cardsRemaining: 0,
      newRemaining: 4,
      extraNewRemaining: 1,
      choiceReady: 1,
      bonusIgnored: true,
      ratings: baseRatings,
      done: 1,
      assessedAtoms: assessed,
      atlasRegion: region,
      hasUnratedActiveCard: true,
      consumedReviewSlot: true,
      consumedNewBudget: "new",
    });

    expect(snapshot).toEqual({
      sessionId: "01JABC",
      startedDue: 37,
      cardsReviewed: 1,
      cardsRemaining: 1,
      newRemaining: 5,
      extraNewRemaining: 1,
      choiceReady: 1,
      bonusIgnored: true,
      ratings: { 1: 0, 2: 0, 3: 1, 4: 0 },
      done: 1,
      assessedAtoms: ["atom-1"],
      atlasRegion: {
        lens: "domain",
        key: "deutsch",
        practise: 3,
        practiceSince: "2026-11-15T19:00:00.000Z",
      },
    });

    baseRatings[3] = 99;
    assessed.push("atom-2");
    region.key = "other";
    expect(snapshot.ratings[3]).toBe(1);
    expect(snapshot.assessedAtoms).toEqual(["atom-1"]);
    expect(snapshot.atlasRegion?.key).toBe("deutsch");
  });

  it("rolls back extra_new slots without double-restoring regular new cards", () => {
    const snapshot = createPausedStudySession({
      sessionId: "01JEXTRA",
      startedDue: 10,
      cardsReviewed: 1,
      cardsRemaining: 19,
      newRemaining: 0,
      extraNewRemaining: 2,
      choiceReady: 0,
      bonusIgnored: false,
      ratings: { 1: 0, 2: 0, 3: 0, 4: 0 },
      done: 0,
      assessedAtoms: [],
      atlasRegion: null,
      hasUnratedActiveCard: true,
      consumedReviewSlot: true,
      consumedNewBudget: "extra_new",
    });

    expect(snapshot.cardsReviewed).toBe(0);
    expect(snapshot.cardsRemaining).toBe(20);
    expect(snapshot.newRemaining).toBe(0);
    expect(snapshot.extraNewRemaining).toBe(3);
  });

  it("leaves budgets untouched when no unrated active card was presented", () => {
    const snapshot = createPausedStudySession({
      sessionId: "01JIDLE",
      startedDue: 5,
      cardsReviewed: 3,
      cardsRemaining: 17,
      newRemaining: 2,
      extraNewRemaining: 1,
      choiceReady: 0,
      bonusIgnored: false,
      ratings: { 1: 0, 2: 1, 3: 2, 4: 0 },
      done: 3,
      assessedAtoms: ["a"],
      atlasRegion: null,
      hasUnratedActiveCard: false,
      consumedReviewSlot: true,
      consumedNewBudget: "new",
    });

    expect(snapshot.cardsReviewed).toBe(3);
    expect(snapshot.cardsRemaining).toBe(17);
    expect(snapshot.newRemaining).toBe(2);
    expect(snapshot.extraNewRemaining).toBe(1);
  });
});

describe("Desktop paused session resume UI and wiring", () => {
  const html = readFileSync(
    resolve(process.cwd(), "desktop/index.html"),
    "utf8",
  );
  const mainTs = readFileSync(
    resolve(process.cwd(), "desktop/src/main.ts"),
    "utf8",
  );

  it("places the Learning Content resume banner outside card-only actions", () => {
    const cardsActionsIdx = html.indexOf('id="content-cards-actions"');
    const headerCloseIdx = html.indexOf("</header>", cardsActionsIdx);
    const bannerIdx = html.indexOf('id="content-study-resume-banner"');
    const cardsAreaIdx = html.indexOf('id="content-cards-area"');
    const sourcesAreaIdx = html.indexOf('id="content-sources-area"');
    expect(bannerIdx).toBeGreaterThan(-1);
    expect(html).toContain('id="lbl-content-resume-status"');
    expect(html).toContain('id="btn-content-resume-session"');
    expect(bannerIdx).toBeGreaterThan(headerCloseIdx);
    expect(bannerIdx).toBeLessThan(cardsAreaIdx);
    expect(bannerIdx).toBeLessThan(sourcesAreaIdx);
  });

  it("pauses on jumpToFullEditor and restores or discards cleanly", () => {
    expect(mainTs).toContain("pauseCurrentStudySession();");
    expect(mainTs).toContain("resumeStudySession()");
    expect(mainTs).toContain("discardPausedStudySession()");
    expect(mainTs).toContain("btn-content-resume-session");
    expect(mainTs).toContain(
      "if (pausedStudySession) {\n        await resumeStudySession();",
    );
    expect(mainTs).toContain(
      "if (paused) {\n      startBtn.disabled = resumeSessionInFlight;",
    );
    expect(mainTs).toContain("previousDesktopUserId !== desktopUserId");
  });

  it("translates resume controls across every desktop locale", () => {
    try {
      for (const locale of LOCALES) {
        setCurrentLocale(locale);
        const pausedLabel = t("study_paused_status");
        const resumeLabel = t("btn_resume_session");
        expect(pausedLabel).not.toBe("study_paused_status");
        expect(resumeLabel).not.toBe("btn_resume_session");
        expect(pausedLabel.length).toBeGreaterThan(0);
        expect(resumeLabel.length).toBeGreaterThan(0);
      }
    } finally {
      setCurrentLocale("en");
    }
  });
});
