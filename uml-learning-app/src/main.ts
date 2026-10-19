import { evaluateDiagramAgainstCriteria } from "./checker/graph-evaluator";
import {
  type DifficultyLevel,
  findLessonById,
  getAllLessons,
  getLearningStages,
  getStarterDiagramForLevel,
  type LearningLesson,
  type LearningStage,
} from "./curriculum/learning-path";
import { renderPropertyInspector } from "./editor/inspector";
import { type EditorTool, UmlCanvasController } from "./editor/uml-canvas";
import { exportToMermaid, exportToPlantUml } from "./exporters/code-exporters";
import { type AppLocale, UI_STRINGS } from "./i18n/translations";
import {
  cloneDiagram,
  getDiagramTypeMeta,
  getEdgeKindMeta,
  getNodeKindMeta,
  UML_DIAGRAM_TYPES,
  UML_EDGE_KINDS,
  UML_NODE_KINDS,
  type UmlDiagram,
  type UmlDiagramType,
  type UmlEdgeKind,
  type UmlNodeKind,
} from "./model/uml-types";
import {
  clearLessonDraft,
  createBlankDiagram,
  downloadTextFile,
  getOverallCompletionStats,
  getStageCompletionStats,
  type LearnerProgress,
  loadLearnerProgress,
  loadLessonDraft,
  loadStudioProjects,
  saveLearnerProgress,
  saveLessonDraft,
  saveStudioProjects,
} from "./storage/app-storage";
import {
  launchConfettiBurst,
  playCelebrationSound,
  showStageCelebrationModal,
  showToastNotification,
  showZamConsolidationModal,
} from "./ui/celebrations";
import { parseTrainingDeepLink } from "./zam/zam-bridge-export";

type ActiveView = "path" | "lesson" | "studio" | "reference";

class UmlLearningApp {
  private currentView: ActiveView = "path";
  private progress: LearnerProgress;
  private studioProjects: UmlDiagram[];
  private activeStudioProjectId: string;
  private showAllToolsInLesson = false;
  private showAllToolsInStudio = false;
  private activeCodeFormat: "plantuml" | "mermaid" = "plantuml";
  private activeCanvas: UmlCanvasController | null = null;

  /**
   * Non-spoilering evaluation state:
   * - `hasCheckedCurrentLesson`: whether the user has clicked "Verify / Diagramm prüfen"
   *   in the currently open lesson & difficulty level.
   * - `showHintInLevel2`: whether the user explicitly requested a hint in Level 2.
   */
  private hasCheckedCurrentLesson = false;
  private showHintInLevel2 = false;

  constructor() {
    this.progress = loadLearnerProgress();
    this.studioProjects = loadStudioProjects(this.progress.locale);
    this.activeStudioProjectId =
      this.studioProjects[0]?.id ?? "studio_default_class";

    this.applyUrlDeepLink(false);
    this.setupThemeToggle();
    this.setupTopNavigation();
    this.syncHeaderChrome();
    this.updateHeaderProgress();
    this.renderCurrentView();

    if (typeof window !== "undefined") {
      window.addEventListener("hashchange", () => {
        if (this.applyUrlDeepLink(true)) {
          this.syncHeaderChrome();
          this.updateHeaderProgress();
          this.renderCurrentView();
        }
      });
    }
  }

  /**
   * Reads `#lesson=1.2` or `?lesson=cls-2-connections&level=2&lang=en` from the URL
   * so clicking a `source_link` from ZAM opens that exact training lesson immediately.
   */
  private applyUrlDeepLink(syncNavButtons: boolean): boolean {
    if (typeof window === "undefined") return false;
    const parsed = parseTrainingDeepLink(
      window.location.hash,
      window.location.search,
    );
    let changed = false;

    if (parsed.locale && parsed.locale !== this.progress.locale) {
      this.progress.locale = parsed.locale;
      changed = true;
    }
    if (parsed.level && parsed.level !== this.progress.difficultyLevel) {
      this.progress.difficultyLevel = parsed.level;
      changed = true;
    }
    if (
      parsed.lessonId &&
      findLessonById(parsed.lessonId, this.progress.locale)
    ) {
      this.progress.activeLessonId = parsed.lessonId;
      this.currentView = "lesson";
      this.hasCheckedCurrentLesson = false;
      this.showHintInLevel2 = false;
      changed = true;
      if (syncNavButtons) {
        document
          .querySelectorAll<HTMLButtonElement>("[data-view]")
          .forEach((b) => {
            b.classList.toggle(
              "is-active",
              b.getAttribute("data-view") === "lesson",
            );
          });
      }
    }

    if (changed) {
      saveLearnerProgress(this.progress);
    }
    return changed;
  }

  public openZamConsolidation(highlightStageId?: string): void {
    const stages = getLearningStages(this.locale);
    const completedStageIds = stages
      .filter(
        (stage) =>
          getStageCompletionStats(stage.id, this.progress).percent === 100,
      )
      .map((stage) => stage.id);

    showZamConsolidationModal({
      locale: this.locale,
      completedStageIds,
      highlightStageId,
      onJumpToLesson: (lessonId) => {
        this.progress.activeLessonId = lessonId;
        this.hasCheckedCurrentLesson = false;
        this.showHintInLevel2 = false;
        saveLearnerProgress(this.progress);
        this.switchView("lesson");
      },
    });
  }

  private get locale(): AppLocale {
    return this.progress.locale;
  }

  private get difficultyLevel(): DifficultyLevel {
    return this.progress.difficultyLevel;
  }

  private get ui() {
    return UI_STRINGS[this.locale];
  }

  /**
   * Ensures `<progress class="progress-ring">` elements sync their `value`
   * attribute to `--value` in browsers that do not yet support
   * `attr(value type(<number>))` (per modern-web-guidance `progress-ring`).
   */
  private bindProgressRingFallbacks(root: ParentNode = document): void {
    const supportsTypedAttr =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("width: attr(value type(<number>))");

    if (supportsTypedAttr) return;

    const rings = root.querySelectorAll<HTMLProgressElement>(
      "progress.progress-ring",
    );
    rings.forEach((progress) => {
      const sync = () => {
        progress.style.setProperty(
          "--value",
          progress.getAttribute("value") ?? "0",
        );
      };
      sync();
      const observer = new MutationObserver(sync);
      observer.observe(progress, {
        attributes: true,
        attributeFilter: ["value"],
      });
    });
  }

  /**
   * Implements the two-state color-scheme toggle per `dark-mode-toggle` guide.
   */
  private setupThemeToggle(): void {
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="color-scheme"]',
    );
    const btn = document.getElementById("theme-toggle-btn");
    if (!meta || !btn) return;

    btn.addEventListener("click", () => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem("color-scheme");
      } catch {
        // ignore
      }
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const systemScheme = systemDark ? "dark" : "light";
      const currentlyRendered =
        stored === "dark" || stored === "light" ? stored : systemScheme;

      const targetScheme = currentlyRendered === "dark" ? "light" : "dark";

      try {
        if (targetScheme !== systemScheme) {
          localStorage.setItem("color-scheme", targetScheme);
          meta.content = targetScheme;
        } else {
          localStorage.removeItem("color-scheme");
          meta.content = "light dark";
        }
      } catch {
        meta.content = targetScheme;
      }
    });

    window.addEventListener("storage", (ev) => {
      if (ev.key === "color-scheme") {
        meta.content = ev.newValue ?? "light dark";
      }
    });
  }

  private setupTopNavigation(): void {
    const navButtons =
      document.querySelectorAll<HTMLButtonElement>("[data-view]");
    navButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.getAttribute("data-view") as ActiveView;
        if (view) {
          this.switchView(view);
        }
      });
    });

    // Difficulty Level buttons (Level 1 vs Level 2)
    document
      .querySelectorAll<HTMLButtonElement>("[data-level]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const lvl = Number(btn.getAttribute("data-level")) as DifficultyLevel;
          if (lvl === 1 || lvl === 2) {
            this.progress.difficultyLevel = lvl;
            this.hasCheckedCurrentLesson = false;
            this.showHintInLevel2 = false;
            saveLearnerProgress(this.progress);
            this.syncHeaderChrome();
            this.renderCurrentView();
            showToastNotification(
              lvl === 2 ? this.ui.level2Title : this.ui.level1Title,
              "info",
              2800,
            );
          }
        });
      });

    // Language buttons (DE vs EN)
    document
      .querySelectorAll<HTMLButtonElement>("[data-locale]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const loc = btn.getAttribute("data-locale") as AppLocale;
          if (loc === "de" || loc === "en") {
            this.progress.locale = loc;
            document.documentElement.lang = loc;
            saveLearnerProgress(this.progress);
            this.syncHeaderChrome();
            this.updateHeaderProgress();
            this.renderCurrentView();
          }
        });
      });

    const soundBtn = document.getElementById("sound-toggle-btn");
    if (soundBtn) {
      const updateSoundIcon = () => {
        soundBtn.textContent = this.progress.soundEnabled ? "🔊" : "🔇";
      };
      updateSoundIcon();
      soundBtn.addEventListener("click", () => {
        this.progress.soundEnabled = !this.progress.soundEnabled;
        saveLearnerProgress(this.progress);
        updateSoundIcon();
        showToastNotification(
          this.progress.soundEnabled
            ? this.ui.soundOnToast
            : this.ui.soundOffToast,
          "info",
          2200,
        );
      });
    }

    const zamBtn = document.getElementById("zam-consolidate-btn");
    zamBtn?.addEventListener("click", () => {
      this.openZamConsolidation();
    });
  }

  private syncHeaderChrome(): void {
    const ui = this.ui;
    document.documentElement.lang = this.locale;

    const brandTitle = document.getElementById("brand-title-text");
    const brandSubtitle = document.getElementById("brand-subtitle-text");
    if (brandTitle) brandTitle.textContent = ui.appTitle;
    if (brandSubtitle) brandSubtitle.textContent = ui.appSubtitle;

    const navPath = document.getElementById("nav-btn-path");
    const navLesson = document.getElementById("nav-btn-lesson");
    const navStudio = document.getElementById("nav-btn-studio");
    const navRef = document.getElementById("nav-btn-reference");
    if (navPath) navPath.textContent = ui.navPath;
    if (navLesson) navLesson.textContent = ui.navLesson;
    if (navStudio) navStudio.textContent = ui.navStudio;
    if (navRef) navRef.textContent = ui.navReference;

    const lvl1Btn = document.getElementById("level-btn-1");
    const lvl2Btn = document.getElementById("level-btn-2");
    if (lvl1Btn) {
      lvl1Btn.textContent = ui.level1Short;
      lvl1Btn.title = ui.level1Desc;
      lvl1Btn.classList.toggle("is-active", this.difficultyLevel === 1);
    }
    if (lvl2Btn) {
      lvl2Btn.textContent = ui.level2Short;
      lvl2Btn.title = ui.level2Desc;
      lvl2Btn.classList.toggle("is-active", this.difficultyLevel === 2);
    }

    const deBtn = document.getElementById("locale-btn-de");
    const enBtn = document.getElementById("locale-btn-en");
    if (deBtn) deBtn.classList.toggle("is-active", this.locale === "de");
    if (enBtn) enBtn.classList.toggle("is-active", this.locale === "en");

    const progLabel = document.getElementById("header-progress-label");
    if (progLabel) progLabel.textContent = ui.progressLabel;

    const zamBtn = document.getElementById("zam-consolidate-btn");
    const zamBtnLabel = document.getElementById("zam-consolidate-btn-label");
    if (zamBtn) zamBtn.title = ui.zamHeaderBtnTitle;
    if (zamBtnLabel) zamBtnLabel.textContent = ui.zamHeaderBtnLabel;

    document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((b) => {
      b.classList.toggle(
        "is-active",
        b.getAttribute("data-view") === this.currentView,
      );
    });
  }

  public switchView(view: ActiveView): void {
    this.currentView = view;
    document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((b) => {
      b.classList.toggle("is-active", b.getAttribute("data-view") === view);
    });
    this.renderCurrentView();
  }

  private updateHeaderProgress(): void {
    const stats = getOverallCompletionStats(this.progress);
    const ring = document.getElementById(
      "header-progress-ring",
    ) as HTMLProgressElement | null;
    const text = document.getElementById("header-progress-text");
    const counts = document.getElementById("header-progress-counts");

    if (ring) {
      ring.setAttribute("value", String(stats.percent));
      ring.style.setProperty("--value", String(stats.percent));
    }
    if (text) {
      text.textContent = `${stats.percent}%`;
    }
    if (counts) {
      counts.textContent = this.ui.stepsCount(stats.completed, stats.total);
    }
    this.bindProgressRingFallbacks(document);
  }

  private renderCurrentView(): void {
    const host = document.getElementById("main-view-host");
    if (!host) return;
    this.activeCanvas = null;

    if (this.currentView === "path") {
      this.renderLearningPathView(host);
    } else if (this.currentView === "lesson") {
      this.renderLessonWorkspaceView(host);
    } else if (this.currentView === "studio") {
      this.renderFreeStudioView(host);
    } else if (this.currentView === "reference") {
      this.renderReferenceView(host);
    }

    this.bindProgressRingFallbacks(host);
  }

  // =========================================================================
  // VIEW 1: LEARNING PATH MAP
  // =========================================================================
  private renderLearningPathView(host: HTMLElement): void {
    const ui = this.ui;
    const stages = getLearningStages(this.locale);
    const overall = getOverallCompletionStats(this.progress);
    const activeFound =
      findLessonById(this.progress.activeLessonId, this.locale) ??
      findLessonById("uc-1-boxes", this.locale)!;

    host.innerHTML = `
      <div class="learning-path-container">
        <section class="path-hero">
          <div class="path-hero-copy">
            <h2>${ui.pathHeroTitle}</h2>
            <p>${ui.pathHeroDesc}</p>
            <div class="badges-rack" aria-label="Badges">
              ${stages
                .map((stage) => {
                  const stats = getStageCompletionStats(
                    stage.id,
                    this.progress,
                  );
                  const earned = stats.percent === 100;
                  return `
                  <span class="badge-chip ${earned ? "is-earned" : ""}" title="${this.escapeHtml(stage.expressionSkillSummary)}">
                    <span>${earned ? stage.badgeIcon : "🔒"}</span>
                    <span>${ui.stageWord} ${stage.stageNumber}: ${stage.badgeTitle}</span>
                  </span>
                `;
                })
                .join("")}
            </div>
          </div>
          <div>
            <button type="button" class="btn-primary btn-large" id="hero-continue-lesson-btn">
              ${ui.continueLessonBtn} ${activeFound.lesson.title}
            </button>
          </div>
        </section>

        <section class="stages-timeline" aria-label="Stages">
          ${stages
            .map((stage) => {
              const stats = getStageCompletionStats(stage.id, this.progress);
              const isComplete = stats.percent === 100;
              return `
              <article class="stage-card ${isComplete ? "is-completed" : ""}" style="--stage-accent: ${stage.colorAccent}">
                <div class="stage-card-header">
                  <div class="stage-card-title-group">
                    <span class="stage-icon" aria-hidden="true">${stage.icon}</span>
                    <div>
                      <h3 class="stage-card-title">${stage.title}</h3>
                      <p class="stage-card-subtitle">${stage.subtitle}</p>
                    </div>
                  </div>
                  <div class="progress-ring-wrapper" title="${stats.completed} / ${stats.total}">
                    <progress
                      value="${stats.percent}"
                      max="100"
                      aria-label="${this.escapeHtml(stage.title)}"
                      class="progress-ring"
                    ></progress>
                    <div class="progress-ring-content">${stats.percent}%</div>
                  </div>
                </div>

                <p class="stage-skill-desc">${stage.expressionSkillSummary}</p>

                <div class="stage-lessons-list">
                  ${stage.lessons
                    .map((lesson) => {
                      const isDone = this.progress.completedLessonIds.includes(
                        lesson.id,
                      );
                      const isDoneL2 =
                        this.progress.completedLevel2LessonIds.includes(
                          lesson.id,
                        );
                      const isCurrent =
                        lesson.id === this.progress.activeLessonId;
                      return `
                        <button
                          type="button"
                          class="stage-lesson-btn ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""}"
                          data-open-lesson="${lesson.id}"
                        >
                          <span>${isDone ? "✅" : isCurrent ? "▶️" : "⚪"} ${lesson.title} ${isDoneL2 ? "🦅" : ""}</span>
                          <span class="lesson-mode-tag">${ui.modeLabels[lesson.mode]}</span>
                        </button>
                      `;
                    })
                    .join("")}
                </div>
              </article>
            `;
            })
            .join("")}
        </section>

        ${
          overall.completed > 0
            ? `
          <div style="margin-top: 2rem; text-align: right;">
            <button type="button" class="btn-secondary btn-sm" id="reset-all-progress-btn">
              ${ui.resetProgressBtn}
            </button>
          </div>
        `
            : ""
        }
      </div>
    `;

    host
      .querySelector("#hero-continue-lesson-btn")
      ?.addEventListener("click", () => {
        this.switchView("lesson");
      });

    host
      .querySelectorAll<HTMLButtonElement>("[data-open-lesson]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const lessonId = btn.getAttribute("data-open-lesson");
          if (lessonId) {
            this.progress.activeLessonId = lessonId;
            this.hasCheckedCurrentLesson = false;
            this.showHintInLevel2 = false;
            saveLearnerProgress(this.progress);
            this.switchView("lesson");
          }
        });
      });

    host
      .querySelector("#reset-all-progress-btn")
      ?.addEventListener("click", () => {
        this.progress.completedLessonIds = [];
        this.progress.completedLevel2LessonIds = [];
        this.progress.completedQuizLessonIds = [];
        this.progress.celebratedStageIds = [];
        saveLearnerProgress(this.progress);
        this.updateHeaderProgress();
        this.renderCurrentView();
        showToastNotification(ui.resetProgressToast, "info");
      });
  }

  // =========================================================================
  // VIEW 2: INTERACTIVE LESSON WORKSPACE
  // =========================================================================
  private renderLessonWorkspaceView(host: HTMLElement): void {
    const ui = this.ui;
    const isLevel2 = this.difficultyLevel === 2;
    const stages = getLearningStages(this.locale);
    const found =
      findLessonById(this.progress.activeLessonId, this.locale) ??
      findLessonById("uc-1-boxes", this.locale)!;
    const { stage, lesson } = found;
    const allLessons = getAllLessons(this.locale);
    const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson =
      currentIndex < allLessons.length - 1
        ? allLessons[currentIndex + 1]
        : null;

    const initialDiagram =
      loadLessonDraft(lesson.id, this.difficultyLevel, this.locale) ??
      getStarterDiagramForLevel(lesson, this.difficultyLevel);
    const quizDone = this.progress.completedQuizLessonIds.includes(lesson.id);

    const activeTaskText = isLevel2
      ? (lesson.level2ScenarioPrompt ?? lesson.taskPrompt)
      : lesson.taskPrompt;

    host.innerHTML = `
      <div class="workspace-grid">
        <!-- Column 1: Didactic Guide, Visual Check & Non-Spoilering Task Mission -->
        <aside class="panel-column panel-pad" aria-label="Lesson Guide">
          <div class="lesson-stage-pill">
            <span>${stage.icon}</span>
            <span>${ui.stageWord} ${stage.stageNumber} · ${ui.stepOf(lesson.stepNumber, stage.lessons.length)}</span>
          </div>
          <h2 class="lesson-title">${lesson.title}</h2>

          <div style="margin: 0.45rem 0 0.65rem;">
            <select id="lesson-quick-select" class="inspector-select" style="width: 100%;" aria-label="Select lesson">
              ${stages
                .map(
                  (st) => `
                <optgroup label="${ui.stageWord} ${st.stageNumber}: ${st.subtitle}">
                  ${st.lessons
                    .map((l) => {
                      const done = this.progress.completedLessonIds.includes(
                        l.id,
                      );
                      return `<option value="${l.id}" ${l.id === lesson.id ? "selected" : ""}>${done ? "✓ " : ""}${l.title}</option>`;
                    })
                    .join("")}
                </optgroup>
              `,
                )
                .join("")}
            </select>
          </div>

          <div class="lesson-why-box">
            <strong>${ui.whyItMattersTitle}</strong><br />
            ${lesson.whyItMatters}
          </div>

          <div class="lesson-explanation">
            ${lesson.explanationHtml}
          </div>

          <!-- Step 1: Visual Quick Check -->
          <div class="visual-check-card">
            <h4>${ui.visualCheckTitle} ${quizDone ? "✅" : ""}</h4>
            <p class="visual-check-question">${lesson.visualCheck.question}</p>
            <div class="visual-check-options" id="quiz-options-box">
              ${lesson.visualCheck.options
                .map(
                  (opt, idx) => `
                <button
                  type="button"
                  class="quiz-option-btn ${quizDone && idx === lesson.visualCheck.correctIndex ? "is-correct" : ""}"
                  data-quiz-idx="${idx}"
                >
                  ${opt}
                </button>
              `,
                )
                .join("")}
            </div>
            <div class="quiz-feedback" id="quiz-feedback-text">
              ${quizDone ? `✅ ${lesson.visualCheck.explanation}` : ui.visualCheckWarmup}
            </div>
          </div>

          <!-- Step 2: Interactive Modeling Task & Non-Spoilering Verification -->
          <div class="task-mission-card">
            ${
              isLevel2
                ? `<div class="level2-mode-banner">🦅 ${ui.level2BadgeText}</div>`
                : ""
            }
            <h4>${isLevel2 ? ui.taskCardTitleLevel2 : ui.taskCardTitleLevel1}</h4>
            <p class="task-prompt-text" id="lesson-task-prompt-text">${activeTaskText}</p>

            <div id="checklist-container-area"></div>
            <div class="diagnostic-feedback-banner" id="live-diagnostic-banner" style="display: none;"></div>

            <div class="lesson-action-row">
              <button type="button" class="btn-primary" id="verify-lesson-btn">
                ${ui.verifyBtn}
              </button>
              ${
                isLevel2
                  ? `<button type="button" class="btn-secondary btn-sm" id="toggle-level2-hint-btn">
                      ${this.showHintInLevel2 ? ui.hideHintBtn : ui.showHintBtn}
                    </button>`
                  : ""
              }
              <button type="button" class="btn-secondary btn-sm" id="load-sample-solution-btn">
                ${ui.sampleSolutionBtn}
              </button>
              <button type="button" class="btn-secondary btn-sm" id="reset-lesson-starter-btn">
                ${ui.resetStarterBtn}
              </button>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);">
            <button type="button" class="btn-secondary btn-sm" id="prev-lesson-btn" ${!prevLesson ? "disabled" : ""}>
              ${ui.prevLessonBtn}
            </button>
            <button type="button" class="btn-secondary btn-sm" id="next-lesson-btn" ${!nextLesson ? "disabled" : ""}>
              ${ui.nextLessonBtn}
            </button>
          </div>
        </aside>

        <!-- Column 2: UML Tool Palette -->
        <aside class="panel-column panel-pad" id="lesson-palette-col" aria-label="UML Tools"></aside>

        <!-- Column 3: Interactive UML 2.5.1 Canvas -->
        <section class="canvas-stage-column">
          <div class="canvas-toolbar">
            <div class="canvas-toolbar-group">
              <button type="button" class="btn-secondary btn-xs" id="canvas-select-mode-btn">
                ${ui.toolbarSelect}
              </button>
              <button type="button" class="btn-secondary btn-xs" id="canvas-undo-btn">
                ${ui.toolbarUndo}
              </button>
              <button type="button" class="btn-secondary btn-xs" id="canvas-redo-btn">
                ${ui.toolbarRedo}
              </button>
              <button type="button" class="btn-secondary btn-xs" id="canvas-autolayout-btn">
                ${ui.toolbarAutoLayout}
              </button>
              <button type="button" class="btn-secondary btn-xs" id="canvas-zoom-out-btn">−</button>
              <button type="button" class="btn-secondary btn-xs" id="canvas-zoom-reset-btn">100%</button>
              <button type="button" class="btn-secondary btn-xs" id="canvas-zoom-in-btn">+</button>
            </div>
            <span class="canvas-status-hint" id="canvas-tool-status">
              ${ui.toolbarHint}
            </span>
          </div>
          <div class="canvas-viewport-wrapper" id="lesson-canvas-mount"></div>
        </section>

        <!-- Column 4: Property Inspector -->
        <aside class="panel-column panel-pad" id="lesson-inspector-col" aria-label="Inspector"></aside>
      </div>
    `;

    const canvasMount = host.querySelector<HTMLElement>(
      "#lesson-canvas-mount",
    )!;
    const inspectorCol = host.querySelector<HTMLElement>(
      "#lesson-inspector-col",
    )!;
    const paletteCol = host.querySelector<HTMLElement>("#lesson-palette-col")!;

    /**
     * Renders the non-spoilering evaluation area:
     * - Before clicking "Verify": checklist is hidden (`noSpoilerPreCheckHint`).
     * - After clicking "Verify": fulfilled criteria show `✅ ${r.description}`,
     *   while open criteria show `🔒 Offenes Kriterium #X` so they never spoil the solution!
     */
    const updateNonSpoileringEvaluation = () => {
      if (!this.activeCanvas) return;
      const diag = this.activeCanvas.getDiagram();
      const evalResult = evaluateDiagramAgainstCriteria(
        diag,
        lesson.criteria,
        this.locale,
      );
      const areaEl = host.querySelector<HTMLElement>(
        "#checklist-container-area",
      );
      const bannerEl = host.querySelector<HTMLElement>(
        "#live-diagnostic-banner",
      );

      if (!areaEl || !bannerEl) return;

      if (!this.hasCheckedCurrentLesson) {
        areaEl.innerHTML = `<div class="no-spoiler-notice">${ui.noSpoilerPreCheckHint}</div>`;
        bannerEl.style.display = "none";
        return;
      }

      areaEl.innerHTML = `
        <ul class="criteria-checklist" id="live-criteria-list">
          ${evalResult.results
            .map((r, idx) =>
              r.passed
                ? `
              <li class="criteria-item is-passed">
                <span>✅</span>
                <span>${r.description}</span>
              </li>
            `
                : `
              <li class="criteria-item is-locked">
                <span>🔒</span>
                <span>${ui.lockedCriterionLabel(idx + 1)}</span>
              </li>
            `,
            )
            .join("")}
        </ul>
      `;

      bannerEl.style.display = "block";
      bannerEl.className = `diagnostic-feedback-banner ${evalResult.allPassed ? "is-success" : ""}`;

      if (evalResult.allPassed) {
        bannerEl.textContent = evalResult.primaryFeedback;
      } else if (
        !isLevel2 ||
        this.showHintInLevel2 ||
        evalResult.isSpecificMistake
      ) {
        bannerEl.textContent = evalResult.primaryFeedback;
      } else {
        bannerEl.textContent = ui.checkResultSummary(
          evalResult.passedCount,
          evalResult.totalCount,
        );
      }
    };

    // In Level 2, provide all tools of the current diagram type so the palette
    // doesn't give away which exact subset of elements is needed.
    const diagTypeMeta = getDiagramTypeMeta(stage.diagramType, this.locale);
    const defaultLessonNodes = isLevel2
      ? Array.from(
          new Set([...diagTypeMeta.recommendedNodes, ...lesson.allowedNodes]),
        )
      : lesson.allowedNodes;
    const defaultLessonEdges = isLevel2
      ? Array.from(
          new Set([...diagTypeMeta.recommendedEdges, ...lesson.allowedEdges]),
        )
      : lesson.allowedEdges;

    const paletteNodes = this.showAllToolsInLesson
      ? (Object.keys(UML_NODE_KINDS) as UmlNodeKind[])
      : defaultLessonNodes;
    const paletteEdges = this.showAllToolsInLesson
      ? (Object.keys(UML_EDGE_KINDS) as UmlEdgeKind[])
      : defaultLessonEdges;

    this.activeCanvas = new UmlCanvasController(
      canvasMount,
      initialDiagram,
      {
        onDiagramChange: (diag) => {
          saveLessonDraft(lesson.id, diag, this.difficultyLevel, this.locale);
          if (this.hasCheckedCurrentLesson) {
            updateNonSpoileringEvaluation();
          }
        },
        onSelectionChange: () => {
          if (!this.activeCanvas) return;
          renderPropertyInspector(
            inspectorCol,
            this.activeCanvas,
            paletteEdges,
            this.locale,
          );
        },
        onToolResetToSelect: () => {
          this.renderPalette(
            paletteCol,
            this.activeCanvas!,
            paletteNodes,
            paletteEdges,
            true,
          );
        },
      },
      this.locale,
    );

    if (paletteEdges[0]) {
      this.activeCanvas.setDefaultEdgeKind(paletteEdges[0]);
    }

    this.renderPalette(
      paletteCol,
      this.activeCanvas,
      paletteNodes,
      paletteEdges,
      true,
    );
    renderPropertyInspector(
      inspectorCol,
      this.activeCanvas,
      paletteEdges,
      this.locale,
    );
    updateNonSpoileringEvaluation();
    this.bindCanvasToolbar(host, this.activeCanvas);

    // Quiz bindings
    host
      .querySelectorAll<HTMLButtonElement>("[data-quiz-idx]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.getAttribute("data-quiz-idx"));
          const feedbackEl = host.querySelector<HTMLElement>(
            "#quiz-feedback-text",
          );
          host
            .querySelectorAll<HTMLButtonElement>("[data-quiz-idx]")
            .forEach((b) => {
              b.classList.remove("is-correct", "is-wrong");
            });

          if (idx === lesson.visualCheck.correctIndex) {
            btn.classList.add("is-correct");
            if (feedbackEl) {
              feedbackEl.textContent = `✅ ${lesson.visualCheck.explanation}`;
            }
            if (!this.progress.completedQuizLessonIds.includes(lesson.id)) {
              this.progress.completedQuizLessonIds.push(lesson.id);
              saveLearnerProgress(this.progress);
            }
          } else {
            btn.classList.add("is-wrong");
            if (feedbackEl) {
              feedbackEl.textContent = ui.visualCheckWrong;
            }
          }
        });
      });

    // Verify & Celebrate button
    host.querySelector("#verify-lesson-btn")?.addEventListener("click", () => {
      if (!this.activeCanvas) return;
      this.hasCheckedCurrentLesson = true;
      const evalResult = evaluateDiagramAgainstCriteria(
        this.activeCanvas.getDiagram(),
        lesson.criteria,
        this.locale,
      );
      updateNonSpoileringEvaluation();

      if (!evalResult.allPassed) {
        showToastNotification(evalResult.primaryFeedback, "warning", 4600);
        return;
      }

      this.handleLessonSuccess(stage, lesson, nextLesson ?? null);
    });

    // Toggle hint in Level 2
    const hintBtn = host.querySelector<HTMLButtonElement>(
      "#toggle-level2-hint-btn",
    );
    hintBtn?.addEventListener("click", () => {
      this.hasCheckedCurrentLesson = true;
      this.showHintInLevel2 = !this.showHintInLevel2;
      hintBtn.textContent = this.showHintInLevel2
        ? ui.hideHintBtn
        : ui.showHintBtn;
      updateNonSpoileringEvaluation();
    });

    // Sample solution button
    host
      .querySelector("#load-sample-solution-btn")
      ?.addEventListener("click", () => {
        if (!this.activeCanvas) return;
        this.activeCanvas.pushUndoSnapshot();
        const sol = cloneDiagram(lesson.sampleSolutionDiagram);
        this.activeCanvas.setDiagram(sol);
        saveLessonDraft(lesson.id, sol, this.difficultyLevel, this.locale);
        this.hasCheckedCurrentLesson = true;
        updateNonSpoileringEvaluation();
        showToastNotification(ui.sampleSolutionLoadedToast, "info");
      });

    // Reset starter diagram button
    host
      .querySelector("#reset-lesson-starter-btn")
      ?.addEventListener("click", () => {
        if (!this.activeCanvas) return;
        clearLessonDraft(lesson.id, this.difficultyLevel, this.locale);
        this.hasCheckedCurrentLesson = false;
        this.showHintInLevel2 = false;
        this.activeCanvas.setDiagram(
          getStarterDiagramForLevel(lesson, this.difficultyLevel),
          true,
        );
        updateNonSpoileringEvaluation();
        showToastNotification(ui.resetStarterToast, "info");
      });

    // Lesson selector & Prev/Next
    const quickSelect = host.querySelector<HTMLSelectElement>(
      "#lesson-quick-select",
    );
    quickSelect?.addEventListener("change", () => {
      this.progress.activeLessonId = quickSelect.value;
      this.hasCheckedCurrentLesson = false;
      this.showHintInLevel2 = false;
      saveLearnerProgress(this.progress);
      this.renderCurrentView();
    });

    host.querySelector("#prev-lesson-btn")?.addEventListener("click", () => {
      if (prevLesson) {
        this.progress.activeLessonId = prevLesson.id;
        this.hasCheckedCurrentLesson = false;
        this.showHintInLevel2 = false;
        saveLearnerProgress(this.progress);
        this.renderCurrentView();
      }
    });

    host.querySelector("#next-lesson-btn")?.addEventListener("click", () => {
      if (nextLesson) {
        this.progress.activeLessonId = nextLesson.id;
        this.hasCheckedCurrentLesson = false;
        this.showHintInLevel2 = false;
        saveLearnerProgress(this.progress);
        this.renderCurrentView();
      }
    });
  }

  private handleLessonSuccess(
    stage: LearningStage,
    lesson: LearningLesson,
    nextLesson: LearningLesson | null,
  ): void {
    if (!this.progress.completedLessonIds.includes(lesson.id)) {
      this.progress.completedLessonIds.push(lesson.id);
    }
    if (
      this.difficultyLevel === 2 &&
      !this.progress.completedLevel2LessonIds.includes(lesson.id)
    ) {
      this.progress.completedLevel2LessonIds.push(lesson.id);
    }

    const stageStats = getStageCompletionStats(stage.id, this.progress);
    const stageCompletedNow = stageStats.percent === 100;

    saveLearnerProgress(this.progress);
    this.updateHeaderProgress();

    if (stageCompletedNow) {
      playCelebrationSound("stage", this.progress.soundEnabled);
      launchConfettiBurst("grand");
      if (!this.progress.celebratedStageIds.includes(stage.id)) {
        this.progress.celebratedStageIds.push(stage.id);
        saveLearnerProgress(this.progress);
      }
      showStageCelebrationModal(
        stage,
        () => {
          if (nextLesson) {
            this.progress.activeLessonId = nextLesson.id;
            this.hasCheckedCurrentLesson = false;
            this.showHintInLevel2 = false;
            saveLearnerProgress(this.progress);
            this.renderCurrentView();
          } else {
            this.switchView("path");
          }
        },
        this.locale,
        (stageId) => {
          this.openZamConsolidation(stageId);
        },
      );
    } else {
      playCelebrationSound("lesson", this.progress.soundEnabled);
      launchConfettiBurst("small");
      showToastNotification(lesson.celebrationMessage, "success", 4000);
      if (nextLesson) {
        this.progress.activeLessonId = nextLesson.id;
        this.hasCheckedCurrentLesson = false;
        this.showHintInLevel2 = false;
        saveLearnerProgress(this.progress);
        window.setTimeout(() => {
          this.renderCurrentView();
        }, 900);
      }
    }
  }

  // =========================================================================
  // VIEW 3: FREE STUDIO ("IDEEN VISUALISIEREN" / "VISUALIZE IDEAS")
  // =========================================================================
  private renderFreeStudioView(host: HTMLElement): void {
    const ui = this.ui;
    let activeProject =
      this.studioProjects.find((p) => p.id === this.activeStudioProjectId) ??
      this.studioProjects[0];
    if (!activeProject) {
      activeProject = createBlankDiagram(
        "class",
        this.locale === "en" ? "My System Design" : "Mein System-Entwurf",
        this.locale,
      );
      this.studioProjects.push(activeProject);
      this.activeStudioProjectId = activeProject.id;
      saveStudioProjects(this.studioProjects);
    }

    const diagMeta = getDiagramTypeMeta(activeProject.diagramType, this.locale);
    const allDiagMetas = (
      Object.keys(UML_DIAGRAM_TYPES) as UmlDiagramType[]
    ).map((t) => getDiagramTypeMeta(t, this.locale));

    host.innerHTML = `
      <div class="workspace-grid is-studio-mode">
        <!-- Left Column: Project Manager, Diagram Type Selector & Full Palette -->
        <aside class="panel-column panel-pad" aria-label="Projects & Tools">
          <div style="margin-bottom: 0.85rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-subtle);">
            <div class="palette-group-title">${ui.studioProjectsHeader}</div>
            <div style="display: flex; gap: 0.35rem; margin-bottom: 0.45rem;">
              <select id="studio-project-select" class="inspector-select" style="flex: 1;" aria-label="Select project">
                ${this.studioProjects
                  .map(
                    (p) =>
                      `<option value="${p.id}" ${p.id === activeProject!.id ? "selected" : ""}>${UML_DIAGRAM_TYPES[p.diagramType]?.icon ?? "📐"} ${this.escapeHtml(p.title)}</option>`,
                  )
                  .join("")}
              </select>
              <button type="button" class="btn-primary btn-xs" id="studio-new-project-btn">${ui.studioNewBtn}</button>
            </div>

            <label class="inspector-label">
              ${ui.studioProjectTitle}
              <input type="text" id="studio-project-title" class="inspector-input" value="${this.escapeHtml(activeProject.title)}" />
            </label>

            <label class="inspector-label">
              ${ui.studioDiagramType}
              <select id="studio-diagram-type" class="inspector-select">
                <optgroup label="${ui.studioCoreGroup}">
                  ${allDiagMetas
                    .filter((d) => d.isCoreLearningPath)
                    .map(
                      (d) =>
                        `<option value="${d.type}" ${activeProject!.diagramType === d.type ? "selected" : ""}>${d.icon} ${d.name}</option>`,
                    )
                    .join("")}
                </optgroup>
                <optgroup label="${ui.studioExtraGroup}">
                  ${allDiagMetas
                    .filter((d) => !d.isCoreLearningPath)
                    .map(
                      (d) =>
                        `<option value="${d.type}" ${activeProject!.diagramType === d.type ? "selected" : ""}>${d.icon} ${d.name}</option>`,
                    )
                    .join("")}
                </optgroup>
              </select>
            </label>
            <p class="inspector-meaning-hint" style="margin-bottom: 0.5rem;">
              <strong>${diagMeta.icon} ${diagMeta.name}:</strong> ${diagMeta.shortDescription}
            </p>

            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              <button type="button" class="btn-secondary btn-xs" id="studio-export-json-btn">${ui.studioJsonExport}</button>
              <label class="btn-secondary btn-xs" style="cursor: pointer; margin: 0;">
                ${ui.studioJsonImport}
                <input type="file" id="studio-import-json-input" accept=".json" style="display: none;" />
              </label>
              <button type="button" class="btn-danger btn-xs" id="studio-clear-canvas-btn">${ui.studioClearBtn}</button>
            </div>
          </div>

          <div id="studio-palette-mount"></div>
        </aside>

        <!-- Center Column: Interactive UML Canvas -->
        <section class="canvas-stage-column">
          <div class="canvas-toolbar">
            <div class="canvas-toolbar-group">
              <button type="button" class="btn-secondary btn-xs" id="canvas-select-mode-btn">
                ${ui.toolbarSelect}
              </button>
              <button type="button" class="btn-secondary btn-xs" id="canvas-undo-btn">${ui.toolbarUndo}</button>
              <button type="button" class="btn-secondary btn-xs" id="canvas-redo-btn">${ui.toolbarRedo}</button>
              <button type="button" class="btn-secondary btn-xs" id="canvas-autolayout-btn">${ui.toolbarAutoLayout}</button>
              <button type="button" class="btn-secondary btn-xs" id="canvas-zoom-out-btn">−</button>
              <button type="button" class="btn-secondary btn-xs" id="canvas-zoom-reset-btn">100%</button>
              <button type="button" class="btn-secondary btn-xs" id="canvas-zoom-in-btn">+</button>
            </div>
            <div class="canvas-toolbar-group">
              <button type="button" class="btn-secondary btn-xs" id="studio-export-svg-btn">${ui.studioSvgExport}</button>
              <button type="button" class="btn-primary btn-xs" id="studio-export-png-btn">${ui.studioPngExport}</button>
            </div>
          </div>
          <div class="canvas-viewport-wrapper" id="studio-canvas-mount"></div>
        </section>

        <!-- Right Column: Property Inspector & Live PlantUML / Mermaid Code Export -->
        <aside class="panel-column panel-pad">
          <div id="studio-inspector-mount"></div>

          <div class="inspector-subsection" style="margin-top: 1.25rem;">
            <div class="inspector-sub-header">
              <h5>${ui.studioCodeHeader}</h5>
              <div style="display: flex; gap: 0.25rem;">
                <button type="button" class="chip-btn ${this.activeCodeFormat === "plantuml" ? "is-active" : ""}" id="code-tab-plantuml">PlantUML</button>
                <button type="button" class="chip-btn ${this.activeCodeFormat === "mermaid" ? "is-active" : ""}" id="code-tab-mermaid">Mermaid</button>
              </div>
            </div>
            <pre class="code-export-box" id="studio-live-code-box"></pre>
            <button type="button" class="btn-secondary btn-xs" id="studio-copy-code-btn" style="margin-top: 0.4rem; width: 100%;">
              ${ui.studioCopyCodeBtn}
            </button>
          </div>
        </aside>
      </div>
    `;

    const canvasMount = host.querySelector<HTMLElement>(
      "#studio-canvas-mount",
    )!;
    const inspectorMount = host.querySelector<HTMLElement>(
      "#studio-inspector-mount",
    )!;
    const paletteMount = host.querySelector<HTMLElement>(
      "#studio-palette-mount",
    )!;
    const codeBox = host.querySelector<HTMLElement>("#studio-live-code-box")!;

    const updateLiveCode = () => {
      if (!this.activeCanvas) return;
      const d = this.activeCanvas.getDiagram();
      codeBox.textContent =
        this.activeCodeFormat === "plantuml"
          ? exportToPlantUml(d)
          : exportToMermaid(d);
    };

    const nodesForStudio = this.showAllToolsInStudio
      ? (Object.keys(UML_NODE_KINDS) as UmlNodeKind[])
      : diagMeta.recommendedNodes;
    const edgesForStudio = this.showAllToolsInStudio
      ? (Object.keys(UML_EDGE_KINDS) as UmlEdgeKind[])
      : diagMeta.recommendedEdges;

    this.activeCanvas = new UmlCanvasController(
      canvasMount,
      activeProject,
      {
        onDiagramChange: () => {
          saveStudioProjects(this.studioProjects);
          updateLiveCode();
        },
        onSelectionChange: () => {
          if (!this.activeCanvas) return;
          renderPropertyInspector(
            inspectorMount,
            this.activeCanvas,
            undefined,
            this.locale,
          );
        },
        onToolResetToSelect: () => {
          this.renderPalette(
            paletteMount,
            this.activeCanvas!,
            nodesForStudio,
            edgesForStudio,
            false,
          );
        },
      },
      this.locale,
    );

    if (edgesForStudio[0]) {
      this.activeCanvas.setDefaultEdgeKind(edgesForStudio[0]);
    }

    this.renderPalette(
      paletteMount,
      this.activeCanvas,
      nodesForStudio,
      edgesForStudio,
      false,
    );
    renderPropertyInspector(
      inspectorMount,
      this.activeCanvas,
      undefined,
      this.locale,
    );
    updateLiveCode();
    this.bindCanvasToolbar(host, this.activeCanvas);

    // Project selector & New Project
    const projSel = host.querySelector<HTMLSelectElement>(
      "#studio-project-select",
    );
    projSel?.addEventListener("change", () => {
      this.activeStudioProjectId = projSel.value;
      this.renderCurrentView();
    });

    host
      .querySelector("#studio-new-project-btn")
      ?.addEventListener("click", () => {
        const created = createBlankDiagram(
          activeProject!.diagramType,
          this.locale === "en"
            ? `Idea Sketch ${this.studioProjects.length + 1}`
            : `Ideen-Skizze ${this.studioProjects.length + 1}`,
          this.locale,
        );
        this.studioProjects.push(created);
        this.activeStudioProjectId = created.id;
        saveStudioProjects(this.studioProjects);
        this.renderCurrentView();
        showToastNotification(
          this.locale === "en"
            ? "New diagram project created!"
            : "Neues Diagramm-Projekt angelegt!",
          "success",
        );
      });

    const titleInp = host.querySelector<HTMLInputElement>(
      "#studio-project-title",
    );
    titleInp?.addEventListener("input", () => {
      activeProject!.title = titleInp.value;
      saveStudioProjects(this.studioProjects);
      updateLiveCode();
    });

    const typeSel = host.querySelector<HTMLSelectElement>(
      "#studio-diagram-type",
    );
    typeSel?.addEventListener("change", () => {
      activeProject!.diagramType = typeSel.value as UmlDiagramType;
      saveStudioProjects(this.studioProjects);
      this.renderCurrentView();
    });

    // Export / Import JSON, SVG, PNG
    host
      .querySelector("#studio-export-json-btn")
      ?.addEventListener("click", () => {
        const content = JSON.stringify(activeProject, null, 2);
        downloadTextFile(
          `${activeProject!.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.uml.json`,
          content,
        );
        showToastNotification(
          this.locale === "en"
            ? "JSON project file exported!"
            : "JSON-Projektdatei exportiert!",
          "success",
        );
      });

    const importInp = host.querySelector<HTMLInputElement>(
      "#studio-import-json-input",
    );
    importInp?.addEventListener("change", async () => {
      const file = importInp.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as UmlDiagram;
        if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
          parsed.id = `imported_${Date.now()}`;
          this.studioProjects.push(parsed);
          this.activeStudioProjectId = parsed.id;
          saveStudioProjects(this.studioProjects);
          this.renderCurrentView();
          showToastNotification(
            this.locale === "en"
              ? `Diagram "${parsed.title}" imported!`
              : `Diagramm „${parsed.title}“ importiert!`,
            "success",
          );
        }
      } catch {
        showToastNotification(
          this.locale === "en"
            ? "Invalid JSON file during import."
            : "Ungültige JSON-Datei beim Import.",
          "warning",
        );
      }
    });

    host
      .querySelector("#studio-clear-canvas-btn")
      ?.addEventListener("click", () => {
        if (!this.activeCanvas) return;
        this.activeCanvas.pushUndoSnapshot();
        activeProject!.nodes = [];
        activeProject!.edges = [];
        saveStudioProjects(this.studioProjects);
        this.activeCanvas.render();
        updateLiveCode();
        showToastNotification(
          this.locale === "en" ? "Canvas cleared." : "Zeichenfläche geleert.",
          "info",
        );
      });

    host
      .querySelector("#studio-export-svg-btn")
      ?.addEventListener("click", () => {
        if (!this.activeCanvas) return;
        const svgStr = this.activeCanvas.exportSvgString();
        downloadTextFile(
          `${activeProject!.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.svg`,
          svgStr,
          "image/svg+xml",
        );
        showToastNotification(
          this.locale === "en"
            ? "SVG vector graphic saved!"
            : "SVG-Vektorgrafik gespeichert!",
          "success",
        );
      });

    host
      .querySelector("#studio-export-png-btn")
      ?.addEventListener("click", () => {
        if (!this.activeCanvas) return;
        this.activeCanvas.exportPngFile(
          `${activeProject!.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`,
        );
        showToastNotification(
          this.locale === "en"
            ? "Downloading PNG image!"
            : "PNG-Bild wird heruntergeladen!",
          "success",
        );
      });

    // Code export tabs & copy
    host.querySelector("#code-tab-plantuml")?.addEventListener("click", () => {
      this.activeCodeFormat = "plantuml";
      updateLiveCode();
    });
    host.querySelector("#code-tab-mermaid")?.addEventListener("click", () => {
      this.activeCodeFormat = "mermaid";
      updateLiveCode();
    });
    host
      .querySelector("#studio-copy-code-btn")
      ?.addEventListener("click", () => {
        navigator.clipboard?.writeText(codeBox.textContent ?? "");
        const fmt =
          this.activeCodeFormat === "plantuml" ? "PlantUML" : "Mermaid";
        showToastNotification(
          this.locale === "en"
            ? `${fmt} code copied to clipboard!`
            : `${fmt}-Code in die Zwischenablage kopiert!`,
          "success",
        );
      });
  }

  // =========================================================================
  // VIEW 4: UML 2.5.1 VISUAL REFERENCE (CHEAT SHEET)
  // =========================================================================
  private renderReferenceView(host: HTMLElement): void {
    const ui = this.ui;
    const allDiagMetas = (
      Object.keys(UML_DIAGRAM_TYPES) as UmlDiagramType[]
    ).map((t) => getDiagramTypeMeta(t, this.locale));
    const allEdgeMetas = (Object.keys(UML_EDGE_KINDS) as UmlEdgeKind[]).map(
      (k) => getEdgeKindMeta(k, this.locale),
    );

    host.innerHTML = `
      <div class="reference-container">
        <h2>${ui.referenceTitle}</h2>
        <p style="color: var(--text-secondary);">
          ${ui.referenceSubtitle}
        </p>

        <h3 style="margin-top: 1.75rem;">${ui.referenceSec1}</h3>
        <div class="reference-grid">
          ${allDiagMetas
            .map(
              (d) => `
            <article class="reference-card">
              <h4>${d.icon} ${d.name} <span style="font-weight: 400; font-size: 0.8rem; color: var(--text-secondary);">(${d.englishName})</span></h4>
              <div class="lesson-mode-tag" style="display: inline-block; margin-top: 0.2rem;">
                ${d.category === "structure" ? ui.structureDiagramTag : ui.behaviorDiagramTag}
                ${d.isCoreLearningPath ? ui.corePathTag : ""}
              </div>
              <p>${d.shortDescription}</p>
              <p><strong>${ui.whenToUseLabel}</strong> ${d.whenToUse}</p>
            </article>
          `,
            )
            .join("")}
        </div>

        <h3 style="margin-top: 2rem;">${ui.referenceSec2}</h3>
        <div class="reference-grid">
          ${allEdgeMetas
            .map(
              (e) => `
            <article class="reference-card">
              <h4>${e.label} <span style="font-weight: 400; font-size: 0.78rem; color: var(--text-secondary);">(${e.umlTerm})</span></h4>
              <p><strong>${ui.symbolismLabel}</strong> ${e.shortHint}</p>
              <p>${e.meaning}</p>
              <p><strong>${ui.directionRuleLabel}</strong> ${e.directionRule}</p>
            </article>
          `,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // SHARED PALETTE & TOOLBAR BINDINGS
  // =========================================================================
  private renderPalette(
    container: HTMLElement,
    canvas: UmlCanvasController,
    nodeKinds: UmlNodeKind[],
    edgeKinds: UmlEdgeKind[],
    isLessonMode: boolean,
  ): void {
    const ui = this.ui;
    const activeTool = canvas.getTool();
    const showAllFlag = isLessonMode
      ? this.showAllToolsInLesson
      : this.showAllToolsInStudio;

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
        <span class="palette-group-title" style="margin: 0;">${ui.toolsHeader}</span>
        <button type="button" class="chip-btn" id="toggle-all-tools-btn">
          ${showAllFlag ? ui.showFocusedTools : ui.showAllTools}
        </button>
      </div>

      <button
        type="button"
        class="palette-btn ${activeTool.mode === "select" ? "is-active" : ""}"
        id="palette-select-tool-btn"
      >
        <span>${ui.selectMoveTool}</span>
      </button>

      <div class="palette-group-title">${ui.boxesHeader}</div>
      <div style="font-size: 0.72rem; color: var(--text-secondary); margin-bottom: 0.4rem;">
        ${ui.boxesSubhint}
      </div>
      ${nodeKinds
        .map((kind) => {
          const meta = getNodeKindMeta(kind, this.locale);
          const isAct =
            activeTool.mode === "add-node" && activeTool.kind === kind;
          return `
            <button
              type="button"
              class="palette-btn ${isAct ? "is-active" : ""}"
              data-tool-node="${kind}"
              draggable="true"
              title="${this.escapeHtml(meta.shortHint)}"
            >
              <span>${meta.label}</span>
              <span class="palette-quick-add" data-quick-add-node="${kind}" title="+">＋</span>
            </button>
          `;
        })
        .join("")}

      ${
        edgeKinds.length > 0
          ? `
        <div class="palette-group-title">${ui.edgesHeader}</div>
        <div style="font-size: 0.72rem; color: var(--text-secondary); margin-bottom: 0.4rem;">
          ${ui.edgesSubhint}
        </div>
        ${edgeKinds
          .map((kind) => {
            const meta = getEdgeKindMeta(kind, this.locale);
            const isAct =
              activeTool.mode === "add-edge" && activeTool.kind === kind;
            return `
              <button
                type="button"
                class="palette-btn ${isAct ? "is-active" : ""}"
                data-tool-edge="${kind}"
                title="${this.escapeHtml(meta.shortHint)} — ${this.escapeHtml(meta.directionRule)}"
              >
                <span>${meta.label}</span>
              </button>
            `;
          })
          .join("")}
      `
          : ""
      }
    `;

    container
      .querySelector("#toggle-all-tools-btn")
      ?.addEventListener("click", () => {
        if (isLessonMode) {
          this.showAllToolsInLesson = !this.showAllToolsInLesson;
        } else {
          this.showAllToolsInStudio = !this.showAllToolsInStudio;
        }
        this.renderCurrentView();
      });

    container
      .querySelector("#palette-select-tool-btn")
      ?.addEventListener("click", () => {
        canvas.setTool({ mode: "select" });
        this.renderPalette(
          container,
          canvas,
          nodeKinds,
          edgeKinds,
          isLessonMode,
        );
      });

    container
      .querySelectorAll<HTMLButtonElement>("[data-tool-node]")
      .forEach((btn) => {
        const kind = btn.getAttribute("data-tool-node") as UmlNodeKind;

        btn.addEventListener("dragstart", (ev) => {
          ev.dataTransfer?.setData("application/x-uml-node-kind", kind);
        });

        btn.addEventListener("click", (ev) => {
          const target = ev.target as HTMLElement;
          if (target.hasAttribute("data-quick-add-node")) {
            ev.stopPropagation();
            canvas.addNodeAtSmartPosition(kind);
            return;
          }
          const tool: EditorTool = { mode: "add-node", kind };
          canvas.setTool(tool);
          this.renderPalette(
            container,
            canvas,
            nodeKinds,
            edgeKinds,
            isLessonMode,
          );
        });
      });

    container
      .querySelectorAll<HTMLButtonElement>("[data-tool-edge]")
      .forEach((btn) => {
        const kind = btn.getAttribute("data-tool-edge") as UmlEdgeKind;
        btn.addEventListener("click", () => {
          canvas.setTool({ mode: "add-edge", kind });
          this.renderPalette(
            container,
            canvas,
            nodeKinds,
            edgeKinds,
            isLessonMode,
          );
        });
      });
  }

  private bindCanvasToolbar(
    host: HTMLElement,
    canvas: UmlCanvasController,
  ): void {
    host
      .querySelector("#canvas-select-mode-btn")
      ?.addEventListener("click", () => {
        canvas.setTool({ mode: "select" });
      });
    host.querySelector("#canvas-undo-btn")?.addEventListener("click", () => {
      canvas.undo();
    });
    host.querySelector("#canvas-redo-btn")?.addEventListener("click", () => {
      canvas.redo();
    });
    host
      .querySelector("#canvas-autolayout-btn")
      ?.addEventListener("click", () => {
        canvas.autoLayout();
      });
    host.querySelector("#canvas-zoom-in-btn")?.addEventListener("click", () => {
      canvas.setZoom(canvas.getZoom() + 0.15);
    });
    host
      .querySelector("#canvas-zoom-out-btn")
      ?.addEventListener("click", () => {
        canvas.setZoom(canvas.getZoom() - 0.15);
      });
    host
      .querySelector("#canvas-zoom-reset-btn")
      ?.addEventListener("click", () => {
        canvas.resetViewport();
      });
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new UmlLearningApp();
});
