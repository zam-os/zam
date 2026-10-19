import type {
  UmlDiagramType,
  UmlEdgeKind,
  UmlNodeKind,
} from "../model/uml-types";

export type AppLocale = "de" | "en";
export type DifficultyLevel = 1 | 2;

export interface UiStrings {
  appTitle: string;
  appSubtitle: string;
  navPath: string;
  navLesson: string;
  navStudio: string;
  navReference: string;
  progressLabel: string;
  stepsCount: (done: number, total: number) => string;
  soundToggleTitle: string;
  soundOnToast: string;
  soundOffToast: string;
  themeToggleTitle: string;
  themeToDark: string;
  themeToLight: string;
  level1Short: string;
  level2Short: string;
  level1Title: string;
  level2Title: string;
  level1Desc: string;
  level2Desc: string;
  pathHeroTitle: string;
  pathHeroDesc: string;
  continueLessonBtn: string;
  resetProgressBtn: string;
  resetProgressToast: string;
  stageWord: string;
  stepOf: (step: number, total: number) => string;
  whyItMattersTitle: string;
  visualCheckTitle: string;
  visualCheckWarmup: string;
  visualCheckWrong: string;
  taskCardTitleLevel1: string;
  taskCardTitleLevel2: string;
  level2BadgeText: string;
  noSpoilerPreCheckHint: string;
  checkResultSummary: (passed: number, total: number) => string;
  lockedCriterionLabel: (index: number) => string;
  showHintBtn: string;
  hideHintBtn: string;
  verifyBtn: string;
  sampleSolutionBtn: string;
  sampleSolutionLoadedToast: string;
  resetStarterBtn: string;
  resetStarterToast: string;
  prevLessonBtn: string;
  nextLessonBtn: string;
  modeLabels: {
    "guided-build": string;
    connections: string;
    "bug-detective": string;
    "capstone-mission": string;
  };
  toolsHeader: string;
  showFocusedTools: string;
  showAllTools: string;
  selectMoveTool: string;
  boxesHeader: string;
  boxesSubhint: string;
  edgesHeader: string;
  edgesSubhint: string;
  toolbarSelect: string;
  toolbarUndo: string;
  toolbarRedo: string;
  toolbarAutoLayout: string;
  toolbarHint: string;
  studioProjectsHeader: string;
  studioNewBtn: string;
  studioProjectTitle: string;
  studioDiagramType: string;
  studioCoreGroup: string;
  studioExtraGroup: string;
  studioJsonExport: string;
  studioJsonImport: string;
  studioClearBtn: string;
  studioSvgExport: string;
  studioPngExport: string;
  studioCodeHeader: string;
  studioCopyCodeBtn: string;
  referenceTitle: string;
  referenceSubtitle: string;
  referenceSec1: string;
  referenceSec2: string;
  structureDiagramTag: string;
  behaviorDiagramTag: string;
  corePathTag: string;
  whenToUseLabel: string;
  symbolismLabel: string;
  directionRuleLabel: string;
  inspectorEmptyTitle: string;
  inspectorEmptyDesc: string;
  shortcutDblClick: string;
  shortcutPortDrag: string;
  shortcutDelete: string;
  shortcutUndo: string;
  inspectorNameLabel: string;
  inspectorStereoLabel: string;
  inspectorStateActsHeader: string;
  inspectorFragmentHeader: string;
  inspectorGuardLabel: string;
  inspectorAttributesHeader: string;
  inspectorEnumValuesHeader: string;
  inspectorOperationsHeader: string;
  inspectorAddBtn: string;
  inspectorDeleteNodeBtn: string;
  inspectorDeleteEdgeBtn: string;
  inspectorFrom: string;
  inspectorTo: string;
  inspectorReverseBtn: string;
  inspectorEdgeKindLabel: string;
  inspectorEdgeLabel: string;
  inspectorEdgeGuard: string;
  inspectorSrcMult: string;
  inspectorTgtMult: string;
  inspectorMultPresets: string;
  celebrationKicker: (stageNum: number) => string;
  celebrationAwardPrefix: string;
  celebrationToolboxHeader: string;
  celebrationContinueBtn: string;
  zamHeaderBtnLabel: string;
  zamHeaderBtnTitle: string;
}

export const UI_STRINGS: Record<AppLocale, UiStrings> = {
  de: {
    appTitle: "UML 2.5.1 Studio & Akademie",
    appSubtitle: "Systeme verstehen. Ideen grafisch präzise ausdrücken.",
    navPath: "🗺️ Lernpfad",
    navLesson: "🎓 Aktuelle Lektion",
    navStudio: "🎨 Freier Editor",
    navReference: "📖 UML 2.5.1 Spickzettel",
    progressLabel: "Systemdenker-Pfad",
    stepsCount: (done, total) => `${done} / ${total} Schritte`,
    soundToggleTitle: "Feier-Klänge ein-/ausschalten",
    soundOnToast: "Feier-Klänge aktiviert",
    soundOffToast: "Feier-Klänge stummgeschaltet",
    themeToggleTitle: "Farbschema umschalten (Hell / Dunkel)",
    themeToDark: "Zu dunklem Farbschema wechseln",
    themeToLight: "Zu hellem Farbschema wechseln",
    level1Short: "🌱 Level 1: Geführt",
    level2Short: "🦅 Level 2: System-Übersetzung",
    level1Title: "Level 1: Geführtes Lernen (Mechanik & Notation)",
    level2Title: "Level 2: Freie System-Übersetzung (Meister-Modus)",
    level1Desc:
      "Schritt-für-Schritt-Anleitung mit vorbereiteten Start-Elementen und fokussierter Werkzeugpalette.",
    level2Desc:
      "Nur das reale System wird beschrieben – du übersetzt es selbstständig auf einer leeren Zeichenfläche in UML 2.5.1.",
    pathHeroTitle: "Dein sichtbarer Weg zum UML-2.5.1-Systemdenker",
    pathHeroDesc:
      "Sich klar ausdrücken zu können, ist eine der wertvollsten Fähigkeiten überhaupt. Wähle oben zwischen Level 1 (Geführt) zum Kennenlernen der Elemente und Level 2 (System-Übersetzung), um echte Systembeschreibungen frei in UML zu übertragen.",
    continueLessonBtn: "🎓 Weiterlernen:",
    resetProgressBtn: "Lernfortschritt zurücksetzen",
    resetProgressToast: "Lernfortschritt wurde zurückgesetzt.",
    stageWord: "Etappe",
    stepOf: (step, total) => `Schritt ${step} von ${total}`,
    whyItMattersTitle: "💡 Warum ist das wichtig?",
    visualCheckTitle: "👁️ Visueller Schnell-Check",
    visualCheckWarmup: "Beantworte kurz die Frage zum Aufwärmen!",
    visualCheckWrong:
      "🤔 Noch nicht ganz – lies dir die Erklärung oben noch einmal kurz durch und probiere eine andere Antwort!",
    taskCardTitleLevel1: "🛠️ Deine Aufgabe im Editor (Level 1: Geführt)",
    taskCardTitleLevel2:
      "🦅 System-Beschreibung übersetzen (Level 2: Ohne Vorgaben)",
    level2BadgeText:
      "Level 2 aktiv: Übersetze die Systembeschreibung eigenständig in UML-Elemente und Verbindungen!",
    noSpoilerPreCheckHint:
      "🔒 Die Prüfkriterien sind noch verborgen, um nichts vorwegzunehmen. Modelliere deine Lösung im Editor und klicke auf „Diagramm prüfen & feiern“, um dein Ergebnis auszuwerten!",
    checkResultSummary: (passed, total) =>
      `Prüfergebnis: ${passed} von ${total} Kriterien erfüllt`,
    lockedCriterionLabel: (index) =>
      `Offenes Kriterium #${index} (wird sichtbar, sobald es im Diagramm erfüllt ist)`,
    showHintBtn: "💡 Nächsten Hinweis zeigen",
    hideHintBtn: "Hinweis ausblenden",
    verifyBtn: "✨ Diagramm prüfen & feiern",
    sampleSolutionBtn: "💡 Musterlösung zeigen",
    sampleSolutionLoadedToast:
      "Musterlösung geladen! Schau dir die Elemente und Verbindungen genau an.",
    resetStarterBtn: "↺ Neu starten",
    resetStarterToast: "Übung auf Startzustand zurückgesetzt.",
    prevLessonBtn: "← Vorherige",
    nextLessonBtn: "Nächste Lektion →",
    modeLabels: {
      "guided-build": "1. Grundbausteine",
      connections: "2. Verbindungen",
      "bug-detective": "3. Fehler-Detektiv",
      "capstone-mission": "4. Etappen-Finale",
    },
    toolsHeader: "Werkzeuge",
    showFocusedTools: "Fokussiert",
    showAllTools: "Alle zeigen",
    selectMoveTool: "🖱️ Auswählen / Bewegen",
    boxesHeader: "📦 Grafische Elemente (Boxen)",
    boxesSubhint:
      "Klicke oder ziehe ein Element auf die Zeichenfläche (oder klicke rechts auf +):",
    edgesHeader: "🔗 Verbindungen (Pfeile & Linien)",
    edgesSubhint:
      "Wähle einen Verbindungstyp und ziehe auf der Zeichenfläche von Start- zu Ziel-Box:",
    toolbarSelect: "🖱️ Auswählen / Verschieben",
    toolbarUndo: "↶ Rückgängig",
    toolbarRedo: "↷ Wiederholen",
    toolbarAutoLayout: "📐 Auto-Layout",
    toolbarHint:
      "Tipp: Doppelklick zum Umbenennen · Ziehe am blauen Punkt ● zum Verbinden",
    studioProjectsHeader: "Meine Diagramm-Projekte",
    studioNewBtn: "+ Neu",
    studioProjectTitle: "Projekttitel",
    studioDiagramType: "UML 2.5.1 Diagrammtyp (alle 14 Typen)",
    studioCoreGroup: "Die 6 Kern-Diagramme",
    studioExtraGroup: "Weitere 8 UML 2.5.1 Diagramme",
    studioJsonExport: "💾 JSON Export",
    studioJsonImport: "📂 JSON Import",
    studioClearBtn: "Leeren",
    studioSvgExport: "🖼️ SVG Export",
    studioPngExport: "📸 PNG Bild speichern",
    studioCodeHeader: "Text-Export (PlantUML / Mermaid)",
    studioCopyCodeBtn: "📋 Code in Zwischenablage kopieren",
    referenceTitle: "📖 UML 2.5.1 Visueller Spickzettel & Ausdrucks-Referenz",
    referenceSubtitle:
      "Alle 14 Diagrammtypen nach OMG UML 2.5.1 sowie die wichtigsten Knoten- und Verbindungsregeln auf einen Blick.",
    referenceSec1: "1. Die 14 offiziellen UML 2.5.1 Diagrammtypen",
    referenceSec2:
      "2. Die wichtigsten UML 2.5.1 Verbindungen & Pfeilrichtungen",
    structureDiagramTag: "🏛️ Strukturdiagramm",
    behaviorDiagramTag: "⚡ Verhaltensdiagramm",
    corePathTag: " · Im Kern-Lernpfad",
    whenToUseLabel: "Wann nutzen?",
    symbolismLabel: "Symbolik:",
    directionRuleLabel: "🧭 Richtungs-Regel:",
    inspectorEmptyTitle: "Kein Element ausgewählt",
    inspectorEmptyDesc:
      "Klicke auf eine Box oder eine Verbindung auf der Zeichenfläche, um Namen, Attribute, Methoden, Multiplizitäten oder Pfeilrichtungen zu bearbeiten.",
    shortcutDblClick: "Schnell-Umbenennen",
    shortcutPortDrag: "Verbinden",
    shortcutDelete: "Element löschen",
    shortcutUndo: "Rückgängig",
    inspectorNameLabel: "Name / Bezeichnung",
    inspectorStereoLabel: "Stereotyp «...» (optional)",
    inspectorStateActsHeader: "Interne Zustands-Aktivitäten",
    inspectorFragmentHeader: "Kombinierter Fragment-Operator",
    inspectorGuardLabel: "Bedingung [Guard]",
    inspectorAttributesHeader: "Attribute",
    inspectorEnumValuesHeader: "Aufzählungswerte",
    inspectorOperationsHeader: "Operationen / Methoden",
    inspectorAddBtn: "+ Hinzufügen",
    inspectorDeleteNodeBtn: "🗑️ Element löschen",
    inspectorDeleteEdgeBtn: "🗑️ Verbindung löschen",
    inspectorFrom: "Von:",
    inspectorTo: "Nach:",
    inspectorReverseBtn: "Richtung umkehren ⇄",
    inspectorEdgeKindLabel: "Verbindungstyp (UML 2.5.1)",
    inspectorEdgeLabel: "Beschriftung / Nachricht / Ereignis",
    inspectorEdgeGuard: "Wächterbedingung [Guard] (ohne Klammern)",
    inspectorSrcMult: "Multiplizität an Quelle",
    inspectorTgtMult: "Multiplizität am Ziel",
    inspectorMultPresets: "Schnellwahl Multiplizität:",
    celebrationKicker: (stageNum) =>
      `ETAPPE ${stageNum} GEFEIERT & ABGESCHLOSSEN`,
    celebrationAwardPrefix: "🏆 Neues Abzeichen errungen:",
    celebrationToolboxHeader: "Dein neuer visueller Werkzeugkasten:",
    celebrationContinueBtn: "Weiter auf dem Lernpfad 🚀",
    zamHeaderBtnLabel: "In ZAM festigen",
    zamHeaderBtnTitle:
      "Wissen in ZAM festigen & Vergessen verhindern (Spaced Repetition)",
  },
  en: {
    appTitle: "UML 2.5.1 Studio & Academy",
    appSubtitle: "Understand systems. Express ideas visually with precision.",
    navPath: "🗺️ Learning Path",
    navLesson: "🎓 Current Lesson",
    navStudio: "🎨 Free Studio",
    navReference: "📖 UML 2.5.1 Cheat Sheet",
    progressLabel: "Systems Thinker Path",
    stepsCount: (done, total) => `${done} / ${total} steps`,
    soundToggleTitle: "Toggle celebration sounds",
    soundOnToast: "Celebration sounds enabled",
    soundOffToast: "Celebration sounds muted",
    themeToggleTitle: "Switch color scheme (Light / Dark)",
    themeToDark: "Switch to dark color scheme",
    themeToLight: "Switch to light color scheme",
    level1Short: "🌱 Level 1: Guided",
    level2Short: "🦅 Level 2: System Translation",
    level1Title: "Level 1: Guided Learning (Mechanics & Notation)",
    level2Title: "Level 2: Free System Translation (Master Mode)",
    level1Desc:
      "Step-by-step instructions with starter elements and a focused tool palette.",
    level2Desc:
      "Only the real-world system is described — you translate it into UML 2.5.1 on a blank canvas yourself.",
    pathHeroTitle:
      "Your Visible Journey to Becoming a UML 2.5.1 Systems Thinker",
    pathHeroDesc:
      "Being able to express yourself clearly is one of the most valuable skills. Switch between Level 1 (Guided) to learn the visual building blocks and Level 2 (System Translation) to translate real-world system descriptions into UML on your own.",
    continueLessonBtn: "🎓 Continue Learning:",
    resetProgressBtn: "Reset learning progress",
    resetProgressToast: "Learning progress has been reset.",
    stageWord: "Stage",
    stepOf: (step, total) => `Step ${step} of ${total}`,
    whyItMattersTitle: "💡 Why does this matter?",
    visualCheckTitle: "👁️ Quick Visual Check",
    visualCheckWarmup: "Answer this quick warm-up question!",
    visualCheckWrong:
      "🤔 Not quite yet — re-read the explanation above and try another option!",
    taskCardTitleLevel1: "🛠️ Your Task in the Editor (Level 1: Guided)",
    taskCardTitleLevel2:
      "🦅 Translate the System Description (Level 2: Unassisted)",
    level2BadgeText:
      "Level 2 active: Translate the system description into UML elements and relationships on your own!",
    noSpoilerPreCheckHint:
      "🔒 The evaluation checklist is hidden so it doesn't spoil the solution. Model your solution on the canvas and click 'Check Diagram & Celebrate' to evaluate your work!",
    checkResultSummary: (passed, total) =>
      `Evaluation Result: ${passed} of ${total} criteria met`,
    lockedCriterionLabel: (index) =>
      `Open Criterion #${index} (will be revealed once satisfied in the diagram)`,
    showHintBtn: "💡 Show Next Hint",
    hideHintBtn: "Hide Hint",
    verifyBtn: "✨ Check Diagram & Celebrate",
    sampleSolutionBtn: "💡 Show Sample Solution",
    sampleSolutionLoadedToast:
      "Sample solution loaded! Inspect the elements and connections closely.",
    resetStarterBtn: "↺ Restart Exercise",
    resetStarterToast: "Exercise reset to initial state.",
    prevLessonBtn: "← Previous",
    nextLessonBtn: "Next Lesson →",
    modeLabels: {
      "guided-build": "1. Building Blocks",
      connections: "2. Connections",
      "bug-detective": "3. Bug Detective",
      "capstone-mission": "4. Stage Finale",
    },
    toolsHeader: "Tools",
    showFocusedTools: "Focused",
    showAllTools: "Show all",
    selectMoveTool: "🖱️ Select / Move",
    boxesHeader: "📦 Graphical Elements (Boxes)",
    boxesSubhint:
      "Click or drag an element onto the canvas (or click + on the right):",
    edgesHeader: "🔗 Connections (Arrows & Lines)",
    edgesSubhint:
      "Select a connection type and drag from source box to target box:",
    toolbarSelect: "🖱️ Select / Move",
    toolbarUndo: "↶ Undo",
    toolbarRedo: "↷ Redo",
    toolbarAutoLayout: "📐 Auto-Layout",
    toolbarHint: "Tip: Double-click to rename · Drag the blue dot ● to connect",
    studioProjectsHeader: "My Diagram Projects",
    studioNewBtn: "+ New",
    studioProjectTitle: "Project Title",
    studioDiagramType: "UML 2.5.1 Diagram Type (all 14 types)",
    studioCoreGroup: "The 6 Core Diagrams",
    studioExtraGroup: "Additional 8 UML 2.5.1 Diagrams",
    studioJsonExport: "💾 JSON Export",
    studioJsonImport: "📂 JSON Import",
    studioClearBtn: "Clear",
    studioSvgExport: "🖼️ SVG Export",
    studioPngExport: "📸 Save PNG Image",
    studioCodeHeader: "Text Export (PlantUML / Mermaid)",
    studioCopyCodeBtn: "📋 Copy Code to Clipboard",
    referenceTitle: "📖 UML 2.5.1 Visual Cheat Sheet & Reference",
    referenceSubtitle:
      "All 14 official OMG UML 2.5.1 diagram types plus key node and relationship rules at a glance.",
    referenceSec1: "1. The 14 Official UML 2.5.1 Diagram Types",
    referenceSec2: "2. Essential UML 2.5.1 Relationships & Arrow Directions",
    structureDiagramTag: "🏛️ Structure Diagram",
    behaviorDiagramTag: "⚡ Behavior Diagram",
    corePathTag: " · Core Learning Path",
    whenToUseLabel: "When to use?",
    symbolismLabel: "Notation:",
    directionRuleLabel: "🧭 Direction Rule:",
    inspectorEmptyTitle: "No Element Selected",
    inspectorEmptyDesc:
      "Click any box or connection on the canvas to edit names, attributes, operations, multiplicities, or arrow directions.",
    shortcutDblClick: "Quick Rename",
    shortcutPortDrag: "Connect",
    shortcutDelete: "Delete Element",
    shortcutUndo: "Undo",
    inspectorNameLabel: "Name / Label",
    inspectorStereoLabel: "Stereotype «...» (optional)",
    inspectorStateActsHeader: "Internal State Activities",
    inspectorFragmentHeader: "Combined Fragment Operator",
    inspectorGuardLabel: "Condition [Guard]",
    inspectorAttributesHeader: "Attributes",
    inspectorEnumValuesHeader: "Enumeration Literals",
    inspectorOperationsHeader: "Operations / Methods",
    inspectorAddBtn: "+ Add",
    inspectorDeleteNodeBtn: "🗑️ Delete Element",
    inspectorDeleteEdgeBtn: "🗑️ Delete Connection",
    inspectorFrom: "From:",
    inspectorTo: "To:",
    inspectorReverseBtn: "Reverse Direction ⇄",
    inspectorEdgeKindLabel: "Connection Type (UML 2.5.1)",
    inspectorEdgeLabel: "Label / Message / Event",
    inspectorEdgeGuard: "Guard Condition [Guard] (without brackets)",
    inspectorSrcMult: "Source Multiplicity",
    inspectorTgtMult: "Target Multiplicity",
    inspectorMultPresets: "Quick Multiplicity:",
    celebrationKicker: (stageNum) => `STAGE ${stageNum} CELEBRATED & COMPLETED`,
    celebrationAwardPrefix: "🏆 New Badge Earned:",
    celebrationToolboxHeader: "Your New Visual Expression Toolbox:",
    celebrationContinueBtn: "Continue on Learning Path 🚀",
    zamHeaderBtnLabel: "Consolidate in ZAM",
    zamHeaderBtnTitle:
      "Consolidate knowledge in ZAM & prevent forgetting (Spaced Repetition)",
  },
};

export const EN_DIAGRAM_TYPE_META: Record<
  UmlDiagramType,
  { name: string; shortDescription: string; whenToUse: string }
> = {
  "use-case": {
    name: "Use Case Diagram",
    shortDescription:
      "Shows from a user perspective WHO (Actors) wants to achieve WHAT (Use Cases) with a system.",
    whenToUse:
      "Right at the start of an idea: defining the system boundary and the value provided to people and external systems.",
  },
  class: {
    name: "Class Diagram",
    shortDescription:
      "Describes the building blocks of a domain (classes, interfaces), their properties, and their relationships.",
    whenToUse:
      "When modeling domain concepts, data structures, inheritance, and part-whole relationships.",
  },
  activity: {
    name: "Activity Diagram",
    shortDescription:
      "Visualizes workflows, step-by-step processes, decisions, and parallel paths.",
    whenToUse:
      "When you want to understand or explain how a business process or algorithm unfolds step by step.",
  },
  "state-machine": {
    name: "State Machine Diagram",
    shortDescription:
      "Shows all states of an object or system and which events trigger state transitions.",
    whenToUse:
      "When an entity (e.g. Order, SmartLock, Ticket) has a clear lifecycle with allowed and forbidden transitions.",
  },
  sequence: {
    name: "Sequence Diagram",
    shortDescription:
      "Depicts the chronological exchange of messages between lifelines from top to bottom.",
    whenToUse:
      "When tracing the exact interaction across multiple components or objects over time for a scenario.",
  },
  component: {
    name: "Component Diagram",
    shortDescription:
      "Shows modular system building blocks (components), their provided and required interfaces, and dependencies.",
    whenToUse:
      "For high-level system architecture: how modules are cleanly decoupled via interfaces.",
  },
  package: {
    name: "Package Diagram",
    shortDescription:
      "Groups model elements into logical namespaces (packages) and shows their import/dependency structure.",
    whenToUse:
      "To organize layered architectures and top-level module dependencies.",
  },
  object: {
    name: "Object Diagram",
    shortDescription:
      "A snapshot of concrete instances and their attribute values at a specific point in time.",
    whenToUse:
      "To validate an abstract class diagram against a concrete example scenario.",
  },
  deployment: {
    name: "Deployment Diagram",
    shortDescription:
      "Shows physical or virtual runtime infrastructure (servers, containers, devices) and deployed artifacts.",
    whenToUse:
      "When visualizing cloud nodes, servers, databases, and communication protocols.",
  },
  "composite-structure": {
    name: "Composite Structure Diagram",
    shortDescription:
      "Looks inside a class or component: internal parts, ports, and connectors.",
    whenToUse:
      "When the internal wiring of a complex component needs to be shown in detail.",
  },
  communication: {
    name: "Communication Diagram",
    shortDescription:
      "Emphasizes structural links between collaborating objects with numbered messages (1, 1.1, 2).",
    whenToUse:
      "As a compact alternative to a sequence diagram when object topology matters more than the timeline.",
  },
  "interaction-overview": {
    name: "Interaction Overview Diagram",
    shortDescription:
      "Combines an activity diagram with embedded interaction frames (sequence fragments).",
    whenToUse:
      "To show control flow across multiple individual sequence scenarios.",
  },
  timing: {
    name: "Timing Diagram",
    shortDescription:
      "Focuses on exact timing constraints and state changes along a measurable time axis.",
    whenToUse:
      "For real-time systems, hardware protocols, or strict SLA/timeout requirements.",
  },
  profile: {
    name: "Profile Diagram",
    shortDescription:
      "Extends the UML metamodel itself with custom stereotypes («stereotype») and tagged values.",
    whenToUse:
      "When tailoring UML for a specific domain (e.g. medical devices, cloud, automotive).",
  },
};

export const EN_NODE_KIND_META: Record<
  UmlNodeKind,
  { label: string; shortHint: string; meaning: string; defaultName: string }
> = {
  actor: {
    label: "Actor",
    shortHint: "Human role or external system outside the system boundary",
    meaning:
      "An Actor (stick figure) represents a role played by a human user or external system interacting with your system. Golden rule: Actors always stand OUTSIDE the system boundary!",
    defaultName: "Customer",
  },
  "use-case": {
    label: "Use Case",
    shortHint: "Concrete user goal (Verb + Noun, e.g. 'Buy Ticket')",
    meaning:
      "An ellipse describes a complete value-delivering goal the system achieves for an actor — placed INSIDE the system boundary.",
    defaultName: "Perform Task",
  },
  "system-boundary": {
    label: "System Boundary",
    shortHint: "Frame enclosing all use cases that belong to your system",
    meaning:
      "Separates what is part of the system being built (inside: use cases) from what is outside (actors).",
    defaultName: "My System",
  },
  class: {
    label: "Class",
    shortHint: "Blueprint for objects with name, attributes, and operations",
    meaning:
      "A rectangle with three compartments: Class name at the top, attributes (`- balance: Euro`) in the middle, and operations (`+ deposit(amount: Euro): void`) at the bottom.",
    defaultName: "NewClass",
  },
  "abstract-class": {
    label: "Abstract Class",
    shortHint: "Superclass that cannot be instantiated directly (italic name)",
    meaning:
      "Bundles shared attributes and methods for subclasses (e.g. `Vehicle` for `Car` and `Bicycle`), rendered with an italic name.",
    defaultName: "AbstractBase",
  },
  interface: {
    label: "Interface",
    shortHint: "Contract of method signatures with «interface» stereotype",
    meaning:
      "Defines WHAT a component must be able to do without prescribing HOW it is implemented internally.",
    defaultName: "IService",
  },
  enum: {
    label: "Enumeration",
    shortHint: "Fixed set of allowed constants (e.g. OPEN, PAID, CANCELLED)",
    meaning:
      "Defines a closed list of named constants with «enumeration» to prevent ambiguous free-text status values.",
    defaultName: "Status",
  },
  package: {
    label: "Package",
    shortHint: "Folder container for grouping classes or components logically",
    meaning:
      "Groups related model elements into a dedicated namespace (recognizable by the top-left folder tab).",
    defaultName: "coremodule",
  },
  object: {
    label: "Object (Instance)",
    shortHint:
      "Concrete runtime instance formatted as `myCar : Car` (underlined)",
    meaning:
      "Shows a concrete runtime instance with actual attribute values, indicated by an underlined header `instanceName : ClassName`.",
    defaultName: "instance : Class",
  },
  "initial-node": {
    label: "Initial Node",
    shortHint: "Filled circle (●): Where the activity workflow begins",
    meaning:
      "Marks the unambiguous entry point of an activity diagram where the control token starts flowing.",
    defaultName: "Start",
  },
  "activity-final": {
    label: "Activity Final",
    shortHint: "Bullseye (◉): Terminates the entire activity immediately",
    meaning:
      "A filled circle inside a ring (bullseye). When a token reaches it, the entire activity completes.",
    defaultName: "End",
  },
  "flow-final": {
    label: "Flow Final",
    shortHint: "Circle with X (⊗): Terminates only this parallel branch",
    meaning:
      "Ends only the local control flow branch while other parallel branches continue.",
    defaultName: "BranchEnd",
  },
  action: {
    label: "Action",
    shortHint:
      "Rounded rectangle for a single work step (e.g. 'Verify Payment')",
    meaning:
      "An executable work step within an activity, phrased with an active verb.",
    defaultName: "Execute Step",
  },
  "decision-merge": {
    label: "Decision / Merge",
    shortHint:
      "Diamond (◇): Branches flow via [Guards] or merges alternative paths",
    meaning:
      "As a Decision, every outgoing edge needs a mutually exclusive guard in square brackets like `[stock > 0]`. As a Merge, it reunites alternative paths.",
    defaultName: "Condition?",
  },
  "fork-join": {
    label: "Fork / Join Bar",
    shortHint:
      "Thick bar (▬): Splits into parallel flows (Fork) or synchronizes them (Join)",
    meaning:
      "As a Fork, it starts multiple concurrent paths simultaneously. As a Join, it waits until ALL incoming parallel paths finish.",
    defaultName: "ParallelBar",
  },
  "object-node": {
    label: "Object Node",
    shortHint: "Sharp rectangle for data or documents flowing between actions",
    meaning:
      "Represents data or physical items (e.g. `Invoice [paid]`) produced by one action and consumed by another.",
    defaultName: "Document",
  },
  swimlane: {
    label: "Swimlane (Partition)",
    shortHint: "Column/lane showing WHO is responsible for the actions inside",
    meaning:
      "Organizes activity actions by responsible role or department (e.g. `Customer`, `Warehouse`).",
    defaultName: "Responsibility",
  },
  "initial-state": {
    label: "Initial State",
    shortHint: "Filled dot (●) pointing to the first real state",
    meaning:
      "Marks the state in which an object's lifecycle begins immediately after creation.",
    defaultName: "Start",
  },
  state: {
    label: "State",
    shortHint: "Rounded rectangle (optionally with entry / do / exit behavior)",
    meaning:
      "Describes a phase in the life of an object (e.g. `Reserved`, `Occupied`) while waiting for events.",
    defaultName: "Ready",
  },
  "final-state": {
    label: "Final State",
    shortHint: "Bullseye (◉): The object's lifecycle is complete",
    meaning:
      "When the object reaches the final state, its state machine terminates.",
    defaultName: "End",
  },
  "choice-pseudostate": {
    label: "Choice Pseudostate",
    shortHint:
      "Diamond (◇) in state machines for dynamic branching via [Guard]",
    meaning:
      "Dynamically selects a target state during a transition based on guard conditions `[...] `.",
    defaultName: "Check",
  },
  lifeline: {
    label: "Lifeline (Participant)",
    shortHint: "Header box `:Service` with a vertical dashed timeline below",
    meaning:
      "Represents an interaction participant (e.g. `:Cart` or `:PaymentService`). Time flows top-to-bottom along the dashed line.",
    defaultName: ":Service",
  },
  "actor-lifeline": {
    label: "Actor Lifeline",
    shortHint: "Human or external actor with its own vertical timeline",
    meaning:
      "Represents the initiating user or external partner in a sequence diagram with a vertical timeline.",
    defaultName: "User",
  },
  "combined-fragment": {
    label: "Combined Fragment",
    shortHint: "Frame with operator `alt`, `opt`, `loop`, or `par`",
    meaning:
      "Encloses sequence messages that execute conditionally (`opt` / `alt [guard]`), repeatedly (`loop`), or in parallel (`par`).",
    defaultName: "Conditional Block",
  },
  component: {
    label: "Component",
    shortHint: "Modular system unit with «component» and component icon",
    meaning:
      "An encapsulated, replaceable system module (e.g. `AuthService`, `BillingModule`) communicating via explicit interfaces.",
    defaultName: "ServiceModule",
  },
  "provided-interface": {
    label: "Provided Interface (Lollipop)",
    shortHint:
      "Closed circle on a stick (○—): Interface offered by a component",
    meaning:
      "The lollipop symbol shows at a glance: This component PROVIDES this interface and fulfills its contract.",
    defaultName: "API",
  },
  "required-interface": {
    label: "Required Interface (Socket)",
    shortHint:
      "Half-circle socket ()—): Interface required from another component",
    meaning:
      "The socket symbol shows: This component REQUIRES a partner that provides the matching interface.",
    defaultName: "DatabaseAPI",
  },
  port: {
    label: "Port",
    shortHint: "Small square interaction point on a component boundary",
    meaning:
      "Bundles a named entry/exit endpoint on a component's boundary (e.g. `https:443`).",
    defaultName: "httpPort",
  },
  "deployment-node": {
    label: "Deployment Node",
    shortHint: "3D box for physical devices, servers, or runtime environments",
    meaning:
      "Represents physical hardware (`«device»`) or a software execution environment (`«executionEnvironment»`).",
    defaultName: "AppServer",
  },
  note: {
    label: "Note / Comment",
    shortHint: "Dog-eared sheet for important constraints or explanations",
    meaning:
      "Allows you to attach rationale, invariants, or helpful notes directly to any model element.",
    defaultName: "Important note...",
  },
};

export const EN_EDGE_KIND_META: Record<
  UmlEdgeKind,
  { label: string; shortHint: string; meaning: string; directionRule: string }
> = {
  association: {
    label: "Association",
    shortHint: "Solid line (──): General relationship or communication link",
    meaning:
      "Expresses that two elements are linked (e.g. an actor communicates with a use case, or two classes know each other).",
    directionRule: "Undirected — connects both partners symmetrically.",
  },
  "directed-association": {
    label: "Directed Association",
    shortHint: "Solid line with open arrowhead (──>): A navigates to B",
    meaning:
      "Shows navigability: The source class holds a reference to the target class (A knows B).",
    directionRule:
      "From the referencing source to the referenced target (open arrow).",
  },
  aggregation: {
    label: "Aggregation (Shared Part-Whole)",
    shortHint:
      "Hollow diamond (◇──) at the whole: The part can exist without the whole",
    meaning:
      "A 'has-a' part-whole relationship where parts survive independently if the whole is dissolved (e.g. `Fleet` ◇── `Vehicle`).",
    directionRule:
      "IMPORTANT: The hollow diamond ◇ always sits at the WHOLE (source), line leads to the PART (target)!",
  },
  composition: {
    label: "Composition (Existence-Dependent)",
    shortHint:
      "Filled diamond (◆──) at the whole: If the whole dies, the part dies too",
    meaning:
      "Strong part-whole relationship with exclusive existence dependency (e.g. `Order` ◆── `OrderItem` or `House` ◆── `Room`).",
    directionRule:
      "IMPORTANT: The filled black diamond ◆ always sits at the WHOLE (source), line leads to the PART (target)!",
  },
  generalization: {
    label: "Inheritance / Generalization",
    shortHint: "Solid line with hollow triangle (──▷): 'is-a' relationship",
    meaning:
      "Expresses inheritance: The specific subclass (e.g. `ElectricCar`) inherits all features of the general superclass (`Vehicle`).",
    directionRule:
      "From the specific subclass to the general superclass (where the hollow triangle ▷ sits).",
  },
  realization: {
    label: "Interface Realization",
    shortHint:
      "Dashed line with hollow triangle (- - ▷): Class implements «interface»",
    meaning:
      "Shows that a class or component implements the contract defined by an `«interface»`.",
    directionRule:
      "From the implementing class/component to the «interface» (where the hollow triangle ▷ sits).",
  },
  dependency: {
    label: "Dependency",
    shortHint: "Dashed line with open arrow (- - >): 'uses temporarily'",
    meaning:
      "Element A uses element B (so changes to B may require changes to A).",
    directionRule:
      "From the dependent client (source) to the required provider (open arrow).",
  },
  include: {
    label: "«include» (Mandatory Sub-Step)",
    shortHint:
      "Dashed arrow with «include»: Base use case ALWAYS invokes sub-use-case",
    meaning:
      "A base use case mandatorily includes a shared sub-step every time (e.g. `Unlock Door ──«include»──> Verify Code`).",
    directionRule:
      "From the main base use case to the mandatorily included sub-use-case!",
  },
  extend: {
    label: "«extend» (Optional Extension)",
    shortHint:
      "Dashed arrow with «extend»: Optional extension points to the base use case",
    meaning:
      "Optional extra behavior plugs into a base use case under specific conditions (e.g. `Redeem Discount ──«extend»──> Buy Ticket`).",
    directionRule:
      "WATCH OUT: From the OPTIONAL extending use case to the base use case (opposite to «include»!).",
  },
  "control-flow": {
    label: "Control Flow / Object Flow",
    shortHint: "Directed arrow (──>) between actions, optionally with [Guard]",
    meaning:
      "Passes flow from one step to the next. After a decision diamond, add a guard in brackets like `[payment valid]`.",
    directionRule:
      "In chronological order from predecessor step to successor step.",
  },
  transition: {
    label: "State Transition",
    shortHint: "Arrow between states labeled `event [guard] / effect`",
    meaning:
      "Describes moving from a source state to a target state when triggered by an event.",
    directionRule: "From the previous state to the new state.",
  },
  "sync-message": {
    label: "Synchronous Message (Call)",
    shortHint: "Solid line with FILLED triangle (──▶): Sender waits for reply",
    meaning:
      "The caller invokes an operation on the receiver and blocks waiting until a reply returns.",
    directionRule: "From the calling lifeline to the called lifeline.",
  },
  "async-message": {
    label: "Asynchronous Message (Signal)",
    shortHint: "Solid line with OPEN arrow (──>): Sender continues immediately",
    meaning:
      "The sender dispatches an event or signal without waiting for a direct response.",
    directionRule: "From sender to receiver.",
  },
  "return-message": {
    label: "Reply / Return Message",
    shortHint:
      "Dashed line with open arrow (- - >): Return value back to caller",
    meaning:
      "Delivers the result of a synchronous call back to the waiting caller lifeline.",
    directionRule: "From the called service back to the original caller.",
  },
  "assembly-connector": {
    label: "Assembly Connector",
    shortHint:
      "Wires a required interface (Socket) to a provided interface (Lollipop)",
    meaning:
      "Connects two components so the interface requirement of one is satisfied by the other.",
    directionRule: "From the requiring consumer to the providing supplier.",
  },
  "note-link": {
    label: "Note Link",
    shortHint: "Dashed line without arrowhead between a Note and an element",
    meaning: "Attaches a comment note to the element it explains.",
    directionRule: "Between Note and any element.",
  },
};
