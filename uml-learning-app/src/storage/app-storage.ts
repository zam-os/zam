import {
  type DifficultyLevel,
  LEARNING_STAGES,
} from "../curriculum/learning-path";
import type { AppLocale } from "../i18n/translations";
import {
  cloneDiagram,
  createUmlId,
  type UmlDiagram,
  type UmlDiagramType,
} from "../model/uml-types";

const PROGRESS_STORAGE_KEY = "uml_academy_progress_v1";
const PROJECTS_STORAGE_KEY = "uml_studio_projects_v1";
const LESSON_DRAFTS_KEY = "uml_academy_lesson_drafts_v1";

export interface LearnerProgress {
  completedLessonIds: string[];
  completedLevel2LessonIds: string[];
  completedQuizLessonIds: string[];
  unlockedStageIds: string[];
  celebratedStageIds: string[];
  activeLessonId: string;
  soundEnabled: boolean;
  locale: AppLocale;
  difficultyLevel: DifficultyLevel;
}

const DEFAULT_PROGRESS: LearnerProgress = {
  completedLessonIds: [],
  completedLevel2LessonIds: [],
  completedQuizLessonIds: [],
  unlockedStageIds: ["stage-1-use-case"],
  celebratedStageIds: [],
  activeLessonId: "uc-1-boxes",
  soundEnabled: true,
  locale: "de",
  difficultyLevel: 1,
};

export function loadLearnerProgress(): LearnerProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<LearnerProgress>;
    return {
      completedLessonIds: Array.isArray(parsed.completedLessonIds)
        ? parsed.completedLessonIds
        : [],
      completedLevel2LessonIds: Array.isArray(parsed.completedLevel2LessonIds)
        ? parsed.completedLevel2LessonIds
        : [],
      completedQuizLessonIds: Array.isArray(parsed.completedQuizLessonIds)
        ? parsed.completedQuizLessonIds
        : [],
      unlockedStageIds: Array.isArray(parsed.unlockedStageIds)
        ? parsed.unlockedStageIds
        : ["stage-1-use-case"],
      celebratedStageIds: Array.isArray(parsed.celebratedStageIds)
        ? parsed.celebratedStageIds
        : [],
      activeLessonId:
        typeof parsed.activeLessonId === "string"
          ? parsed.activeLessonId
          : "uc-1-boxes",
      soundEnabled:
        typeof parsed.soundEnabled === "boolean" ? parsed.soundEnabled : true,
      locale: parsed.locale === "en" ? "en" : "de",
      difficultyLevel: parsed.difficultyLevel === 2 ? 2 : 1,
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveLearnerProgress(progress: LearnerProgress): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors
  }
}

function getDraftKey(
  lessonId: string,
  level: DifficultyLevel = 1,
  locale: AppLocale = "de",
): string {
  return `${lessonId}_l${level}_${locale}`;
}

export function saveLessonDraft(
  lessonId: string,
  diagram: UmlDiagram,
  level: DifficultyLevel = 1,
  locale: AppLocale = "de",
): void {
  try {
    const raw = localStorage.getItem(LESSON_DRAFTS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, UmlDiagram>) : {};
    map[getDraftKey(lessonId, level, locale)] = diagram;
    localStorage.setItem(LESSON_DRAFTS_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadLessonDraft(
  lessonId: string,
  level: DifficultyLevel = 1,
  locale: AppLocale = "de",
): UmlDiagram | null {
  try {
    const raw = localStorage.getItem(LESSON_DRAFTS_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, UmlDiagram>;
    const key = getDraftKey(lessonId, level, locale);
    if (map[key]) return cloneDiagram(map[key]);
    if (level === 1 && locale === "de" && map[lessonId]) {
      return cloneDiagram(map[lessonId]);
    }
    return null;
  } catch {
    return null;
  }
}

export function clearLessonDraft(
  lessonId: string,
  level: DifficultyLevel = 1,
  locale: AppLocale = "de",
): void {
  try {
    const raw = localStorage.getItem(LESSON_DRAFTS_KEY);
    if (!raw) return;
    const map = JSON.parse(raw) as Record<string, UmlDiagram>;
    delete map[getDraftKey(lessonId, level, locale)];
    if (level === 1 && locale === "de") {
      delete map[lessonId];
    }
    localStorage.setItem(LESSON_DRAFTS_KEY, JSON.stringify(map));
  } catch {
    // Ignore
  }
}

export function getDefaultStudioProjects(
  locale: AppLocale = "de",
): UmlDiagram[] {
  const isEn = locale === "en";
  return [
    {
      id: "studio_default_class",
      title: isEn
        ? "My System Idea (Class Diagram)"
        : "Meine System-Idee (Klassendiagramm)",
      diagramType: "class",
      description: isEn
        ? "Free class diagram for visualizing your own domain concepts and relationships."
        : "Freies Klassendiagramm zum Visualisieren deiner eigenen Domänen-Begriffe und Beziehungen.",
      nodes: [
        {
          id: "st_cls_1",
          kind: "class",
          name: isEn ? "User" : "Benutzer",
          x: 90,
          y: 90,
          width: 195,
          height: 126,
          attributes: [
            { id: "sa1", visibility: "-", name: "name", type: "String" },
            { id: "sa2", visibility: "-", name: "email", type: "String" },
          ],
          operations: [
            {
              id: "so1",
              visibility: "+",
              name: isEn ? "createProject" : "projektErstellen",
              parameters: isEn ? "title: String" : "titel: String",
              returnType: isEn ? "Project" : "Projekt",
            },
          ],
        },
        {
          id: "st_cls_2",
          kind: "class",
          name: isEn ? "Project" : "Projekt",
          x: 380,
          y: 90,
          width: 195,
          height: 126,
          attributes: [
            {
              id: "sa3",
              visibility: "-",
              name: isEn ? "title" : "titel",
              type: "String",
            },
            {
              id: "sa4",
              visibility: "-",
              name: isEn ? "createdAt" : "erstelltAm",
              type: "Date",
            },
          ],
          operations: [
            {
              id: "so2",
              visibility: "+",
              name: isEn ? "addTask" : "aufgabeHinzufuegen",
              parameters: "",
              returnType: "void",
            },
          ],
        },
        {
          id: "st_cls_3",
          kind: "class",
          name: isEn ? "Task" : "Aufgabe",
          x: 660,
          y: 90,
          width: 190,
          height: 120,
          attributes: [
            {
              id: "sa5",
              visibility: "-",
              name: isEn ? "description" : "beschreibung",
              type: "String",
            },
            {
              id: "sa6",
              visibility: "-",
              name: isEn ? "completed" : "erledigt",
              type: "boolean",
            },
          ],
          operations: [],
        },
      ],
      edges: [
        {
          id: "st_e1",
          kind: "directed-association",
          sourceId: "st_cls_1",
          targetId: "st_cls_2",
          sourceMultiplicity: "1",
          targetMultiplicity: "0..*",
          label: isEn ? "owns" : "besitzt",
        },
        {
          id: "st_e2",
          kind: "composition",
          sourceId: "st_cls_2",
          targetId: "st_cls_3",
          sourceMultiplicity: "1",
          targetMultiplicity: "1..*",
          label: isEn ? "contains" : "enthält",
        },
      ],
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function loadStudioProjects(locale: AppLocale = "de"): UmlDiagram[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return getDefaultStudioProjects(locale);
    const parsed = JSON.parse(raw) as UmlDiagram[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : getDefaultStudioProjects(locale);
  } catch {
    return getDefaultStudioProjects(locale);
  }
}

export function saveStudioProjects(projects: UmlDiagram[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Ignore
  }
}

export function createBlankDiagram(
  diagramType: UmlDiagramType,
  title?: string,
  locale: AppLocale = "de",
): UmlDiagram {
  return {
    id: createUmlId("proj"),
    title:
      title ??
      (locale === "en"
        ? `New Diagram (${diagramType})`
        : `Neues Diagramm (${diagramType})`),
    diagramType,
    nodes: [],
    edges: [],
    updatedAt: new Date().toISOString(),
  };
}

export function getStageCompletionStats(
  stageId: string,
  progress: LearnerProgress,
): { completed: number; total: number; percent: number } {
  const stage = LEARNING_STAGES.find((s) => s.id === stageId);
  if (!stage) return { completed: 0, total: 0, percent: 0 };
  const total = stage.lessons.length;
  const completed = stage.lessons.filter((l) =>
    progress.completedLessonIds.includes(l.id),
  ).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

export function getOverallCompletionStats(progress: LearnerProgress): {
  completed: number;
  total: number;
  percent: number;
  completedStages: number;
  totalStages: number;
} {
  const allLessons = LEARNING_STAGES.flatMap((s) => s.lessons);
  const total = allLessons.length;
  const completed = allLessons.filter((l) =>
    progress.completedLessonIds.includes(l.id),
  ).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const completedStages = LEARNING_STAGES.filter((s) =>
    s.lessons.every((l) => progress.completedLessonIds.includes(l.id)),
  ).length;
  return {
    completed,
    total,
    percent,
    completedStages,
    totalStages: LEARNING_STAGES.length,
  };
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = "application/json",
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
