import type { AppLocale, DifficultyLevel } from "../i18n/translations";

export const ZAM_UML_BUNDLED_CELL_ID = "zam:uml-2-5-1-systemdenken";
export const ZAM_UML_TOPIC_KEY = "uml-learning-app/UML-Studio-Academy.html";

export interface ZamPracticeCardSpec {
  id: string;
  atomId: string;
  stageId: string;
  stageNumber: number;
  lessonStep: string;
  lessonId: string;
  tier: 1 | 2;
  title: Record<AppLocale, string>;
  question: Record<AppLocale, string>;
  answer: Record<AppLocale, string>;
  tags: string[];
  sourceLink: string;
}

export interface ZamAtomSummarySpec {
  atomId: string;
  stageId: string;
  stageNumber: number;
  slug: string;
  title: Record<AppLocale, string>;
  summary: Record<AppLocale, string>;
  lessonStepRange: string;
}

export const LESSON_STEP_TO_ID: Record<string, string> = {
  "1.1": "uc-1-boxes",
  "1.2": "uc-2-connections",
  "1.3": "uc-3-detective",
  "1.4": "uc-4-capstone",
  "2.1": "cls-1-boxes",
  "2.2": "cls-2-connections",
  "2.3": "cls-3-detective",
  "2.4": "cls-4-capstone",
  "3.1": "act-1-boxes",
  "3.2": "act-2-connections",
  "3.3": "act-3-detective",
  "3.4": "act-4-capstone",
  "4.1": "stm-1-boxes",
  "4.2": "stm-2-connections",
  "4.3": "stm-3-detective",
  "4.4": "stm-4-capstone",
  "5.1": "seq-1-boxes",
  "5.2": "seq-2-connections",
  "5.3": "seq-3-detective",
  "5.4": "seq-4-capstone",
  "6.1": "cmp-1-boxes",
  "6.2": "cmp-2-connections",
  "6.3": "cmp-3-detective",
  "6.4": "cmp-4-capstone",
};

export const ZAM_STAGE_ATOMS: ZamAtomSummarySpec[] = [
  {
    atomId: "01K8M251SYST00000000000A01",
    stageId: "stage-1-use-case",
    stageNumber: 1,
    slug: "use-case-systemgrenze-include-extend",
    lessonStepRange: "1.1 – 1.4",
    title: {
      de: "Etappe 1: Use-Case-Diagramm — Systemgrenze, Akteure, «include» vs. «extend»",
      en: "Stage 1: Use Case Diagram — System Boundary, Actors, «include» vs. «extend»",
    },
    summary: {
      de: "Akteure außerhalb der Systemgrenze; «include» (Pflicht, Basis → Teil-UC) vs. «extend» (Optional, Erweiterung → Basis-UC).",
      en: "Actors outside the system boundary; «include» (mandatory, base → sub-UC) vs. «extend» (optional, extension → base-UC).",
    },
  },
  {
    atomId: "01K8M251SYST00000000000A02",
    stageId: "stage-2-class",
    stageNumber: 2,
    slug: "klassendiagramm-komposition-aggregation-vererbung",
    lessonStepRange: "2.1 – 2.4",
    title: {
      de: "Etappe 2: Klassendiagramm — Sichtbarkeiten, Vererbung, Aggregation vs. Komposition",
      en: "Stage 2: Class Diagram — Visibility, Inheritance, Aggregation vs. Composition",
    },
    summary: {
      de: "Komposition (◆ am Ganzen, Existenzabhängigkeit) vs. Aggregation (◇ am Ganzen, unabhängiges Überleben) und Vererbung (──▷).",
      en: "Composition (◆ at the whole, lifecycle dependency) vs. Aggregation (◇ at the whole, independent survival) and Generalization (──▷).",
    },
  },
  {
    atomId: "01K8M251SYST00000000000A03",
    stageId: "stage-3-activity",
    stageNumber: 3,
    slug: "aktivitaetsdiagramm-guards-fork-join",
    lessonStepRange: "3.1 – 3.4",
    title: {
      de: "Etappe 3: Aktivitätsdiagramm — Entscheidungsrauten, Guards und Fork/Join",
      en: "Stage 3: Activity Diagram — Decision Diamonds, Guards, and Fork/Join",
    },
    summary: {
      de: "Entscheidungsraute (◇, ODER-Verzweigung mit [Guards]) vs. Synchronisationsbalken (▬, UND-Parallelität) sowie ◉ vs. ⊗.",
      en: "Decision diamond (◇, OR-branching with [Guards]) vs. Fork/Join bar (▬, AND-concurrency) plus ◉ vs. ⊗.",
    },
  },
  {
    atomId: "01K8M251SYST00000000000A04",
    stageId: "stage-4-state",
    stageNumber: 4,
    slug: "zustandsdiagramm-ereignis-guard-aktion",
    lessonStepRange: "4.1 – 4.4",
    title: {
      de: "Etappe 4: Zustandsdiagramm — Lebenszyklus und Ereignis [Guard] / Aktion",
      en: "Stage 4: State Machine — Lifecycle and Event [Guard] / Action",
    },
    summary: {
      de: "Zustände als Lebensphasen eines Objekts; Übergangssyntax Ereignis [Wächterbedingung] / Aktion und interne Aktivitäten (entry/do/exit).",
      en: "States as object lifecycle phases; transition syntax Event [Guard] / Action and internal activities (entry/do/exit).",
    },
  },
  {
    atomId: "01K8M251SYST00000000000A05",
    stageId: "stage-5-sequence",
    stageNumber: 5,
    slug: "sequenzdiagramm-lebenslinien-nachrichten-fragmente",
    lessonStepRange: "5.1 – 5.4",
    title: {
      de: "Etappe 5: Sequenzdiagramm — Lebenslinien, Nachrichtentypen und Fragmente",
      en: "Stage 5: Sequence Diagram — Lifelines, Message Types, and Fragments",
    },
    summary: {
      de: "Zeitachse von oben nach unten; synchrone (▸) vs. asynchrone (>) vs. Antwort-Nachrichten (- - >) und Fragmente (alt/opt/loop/par).",
      en: "Top-to-bottom timeline; synchronous (▸) vs. asynchronous (>) vs. reply messages (- - >) and fragments (alt/opt/loop/par).",
    },
  },
  {
    atomId: "01K8M251SYST00000000000A06",
    stageId: "stage-6-component",
    stageNumber: 6,
    slug: "komponentendiagramm-lollipop-socket-entkopplung",
    lessonStepRange: "6.1 – 6.4",
    title: {
      de: "Etappe 6: Komponentendiagramm — Lollipop (○—), Socket ()—) und Entkopplung",
      en: "Stage 6: Component Diagram — Lollipop (○—), Socket ()—), and Decoupling",
    },
    summary: {
      de: "Angebotene Schnittstelle (Lollipop ○—) vs. benötigte Schnittstelle (Socket ()—) für lose gekoppelte Systemarchitekturen.",
      en: "Provided interface (Lollipop ○—) vs. required interface (Socket ()—) for loosely coupled system architectures.",
    },
  },
];

export const ZAM_PRACTICE_CARDS: ZamPracticeCardSpec[] = [
  {
    id: "01K8M251SYST00000000000J01",
    atomId: "01K8M251SYST00000000000A01",
    stageId: "stage-1-use-case",
    stageNumber: 1,
    lessonStep: "1.2",
    lessonId: "uc-2-connections",
    tier: 1,
    title: {
      de: "Use-Case-Diagramm: Pfeilrichtung «include» vs. «extend»",
      en: "Use Case Diagram: Arrow direction «include» vs. «extend»",
    },
    question: {
      de: "In welche Richtung zeigen die gestrichelten Pfeile bei «include» (Pflicht-Teilschritt) und «extend» (optionale Erweiterung) im UML 2.5.1 Use-Case-Diagramm?",
      en: "In which direction do the dashed arrows point for «include» (mandatory sub-step) and «extend» (optional extension) in a UML 2.5.1 Use Case Diagram?",
    },
    answer: {
      de: "• «include»: Vom Basis-Use-Case zum eingebundenen Pflicht-Use-Case.\n• «extend»: Vom optionalen Erweiterungs-Use-Case zurück zum Basis-Use-Case.",
      en: "• «include»: From the base Use Case to the mandatorily included sub-Use-Case.\n• «extend»: From the optional extending Use Case back to the base Use Case.",
    },
    tags: ["uml-2.5.1", "use-case", "stage-1", "systemdenken"],
    sourceLink: `${ZAM_UML_TOPIC_KEY}#lesson=1.2`,
  },
  {
    id: "01K8M251SYST00000000000J02",
    atomId: "01K8M251SYST00000000000A01",
    stageId: "stage-1-use-case",
    stageNumber: 1,
    lessonStep: "1.3",
    lessonId: "uc-3-detective",
    tier: 2,
    title: {
      de: "Use-Case-Diagramm: Platzierung von Akteuren & Systemgrenze",
      en: "Use Case Diagram: Actor placement & System Boundary",
    },
    question: {
      de: "Wo stehen Akteure (Mensch oder Fremdsystem) relativ zur Systemgrenze im UML 2.5.1 Use-Case-Diagramm – und was liegt innerhalb der Systemgrenze?",
      en: "Where are Actors (human or external system) placed relative to the System Boundary in a UML 2.5.1 Use Case Diagram — and what sits inside the boundary?",
    },
    answer: {
      de: "Akteure stehen immer AUSSERHALB der Systemgrenze. Innerhalb des Systemgrenzen-Rahmens liegen ausschließlich die Anwendungsfälle (Use Cases), die das System selbst verantwortet.",
      en: "Actors always stand OUTSIDE the System Boundary. Only the Use Cases delivered by the system itself sit INSIDE the boundary frame.",
    },
    tags: ["uml-2.5.1", "use-case", "stage-1", "systemdenken"],
    sourceLink: `${ZAM_UML_TOPIC_KEY}#lesson=1.3`,
  },
  {
    id: "01K8M251SYST00000000000J03",
    atomId: "01K8M251SYST00000000000A02",
    stageId: "stage-2-class",
    stageNumber: 2,
    lessonStep: "2.2",
    lessonId: "cls-2-connections",
    tier: 1,
    title: {
      de: "Klassendiagramm: Wo sitzt die Raute bei Komposition (◆) und Aggregation (◇)?",
      en: "Class Diagram: Where does the diamond sit in Composition (◆) and Aggregation (◇)?",
    },
    question: {
      de: "An welchem Ende einer Teil-Ganzes-Beziehung sitzt im UML 2.5.1 Klassendiagramm die Raute (◆ Komposition bzw. ◇ Aggregation), und worin unterscheiden sich beide?",
      en: "At which end of a part-whole relationship does the diamond (◆ Composition or ◇ Aggregation) sit in a UML 2.5.1 Class Diagram, and how do they differ?",
    },
    answer: {
      de: "Die Raute sitzt immer am GANZEN (Container-Klasse).\n• Gefüllte Raute ◆ (Komposition): Strenge Existenzabhängigkeit (stirbt das Ganze, sterben die Teile mit).\n• Leere Raute ◇ (Aggregation): Lockere Teil-Ganzes-Beziehung (Teile überleben unabhängig).",
      en: "The diamond always sits at the WHOLE (container class).\n• Filled diamond ◆ (Composition): Strict lifecycle dependency (if the whole is deleted, its parts are deleted too).\n• Hollow diamond ◇ (Aggregation): Shared part-whole relationship (parts survive independently).",
    },
    tags: ["uml-2.5.1", "class-diagram", "stage-2", "systemdenken"],
    sourceLink: `${ZAM_UML_TOPIC_KEY}#lesson=2.2`,
  },
  {
    id: "01K8M251SYST00000000000J04",
    atomId: "01K8M251SYST00000000000A02",
    stageId: "stage-2-class",
    stageNumber: 2,
    lessonStep: "2.4",
    lessonId: "cls-4-capstone",
    tier: 2,
    title: {
      de: "Klassendiagramm: Vererbung (──▷) vs. Schnittstellen-Realisierung (- - ▷)",
      en: "Class Diagram: Inheritance (──▷) vs. Interface Realization (- - ▷)",
    },
    question: {
      de: "Wie unterscheiden sich Vererbung (Generalisierung) und Schnittstellen-Realisierung in Notation und Pfeilrichtung im UML 2.5.1 Klassendiagramm?",
      en: "How do Inheritance (Generalization) and Interface Realization differ in notation and arrow direction in a UML 2.5.1 Class Diagram?",
    },
    answer: {
      de: "Beide zeigen mit einem geschlossenen leeren Dreieck (▷) vom Speziellen zum Allgemeinen:\n• Vererbung: Durchgezogene Linie (──▷) von der Unterklasse zur Oberklasse.\n• Realisierung: Gestrichelte Linie (- - ▷) von der implementierenden Klasse zum «interface».",
      en: "Both point with a hollow triangle (▷) from the specific to the general:\n• Generalization: Solid line (──▷) from subclass to superclass.\n• Realization: Dashed line (- - ▷) from implementing class to «interface».",
    },
    tags: ["uml-2.5.1", "class-diagram", "stage-2", "systemdenken"],
    sourceLink: `${ZAM_UML_TOPIC_KEY}#lesson=2.4`,
  },
  {
    id: "01K8M251SYST00000000000J05",
    atomId: "01K8M251SYST00000000000A03",
    stageId: "stage-3-activity",
    stageNumber: 3,
    lessonStep: "3.2",
    lessonId: "act-2-connections",
    tier: 1,
    title: {
      de: "Aktivitätsdiagramm: Entscheidungsraute (◇) vs. Synchronisationsbalken (▬)",
      en: "Activity Diagram: Decision Diamond (◇) vs. Fork/Join Bar (▬)",
    },
    question: {
      de: "Wann nutzt man im UML 2.5.1 Aktivitätsdiagramm eine Raute (◇) und wann einen dicken Balken (▬)?",
      en: "When do you use a Diamond (◇) versus a thick Bar (▬) in a UML 2.5.1 Activity Diagram?",
    },
    answer: {
      de: "• Raute ◇ (Decision/Merge): Exklusive ODER-Verzweigung anhand von Bedingungen in eckigen Klammern ([Guard]).\n• Dicker Balken ▬ (Fork/Join): Gleichzeitige UND-Parallelität (Fork startet alle Pfade parallel; Join wartet auf alle eingehenden Pfade).",
      en: "• Diamond ◇ (Decision/Merge): Mutually exclusive OR-branching governed by [Guard] conditions.\n• Thick Bar ▬ (Fork/Join): Concurrent AND-parallelism (Fork starts all outgoing branches simultaneously; Join waits until all incoming branches complete).",
    },
    tags: ["uml-2.5.1", "activity-diagram", "stage-3", "systemdenken"],
    sourceLink: `${ZAM_UML_TOPIC_KEY}#lesson=3.2`,
  },
  {
    id: "01K8M251SYST00000000000J06",
    atomId: "01K8M251SYST00000000000A03",
    stageId: "stage-3-activity",
    stageNumber: 3,
    lessonStep: "3.1",
    lessonId: "act-1-boxes",
    tier: 2,
    title: {
      de: "Aktivitätsdiagramm: Aktivitätsende (◉) vs. Ablaufende (⊗)",
      en: "Activity Diagram: Activity Final (◉) vs. Flow Final (⊗)",
    },
    question: {
      de: "Was ist der Unterschied zwischen dem Aktivitätsende (Bullseye ◉) und dem Ablaufende (Kreis mit X ⊗) im UML 2.5.1 Aktivitätsdiagramm?",
      en: "What is the difference between Activity Final (Bullseye ◉) and Flow Final (Circle with X ⊗) in a UML 2.5.1 Activity Diagram?",
    },
    answer: {
      de: "• Aktivitätsende (◉): Beendet sofort die gesamte Aktivität inklusive aller parallelen Zweige.\n• Ablaufende (⊗): Beendet nur den lokalen parallelen Zweig, während andere Zweige weiterlaufen.",
      en: "• Activity Final (◉): Immediately terminates the entire activity including all concurrent branches.\n• Flow Final (⊗): Terminates only the local parallel flow branch while other branches keep running.",
    },
    tags: ["uml-2.5.1", "activity-diagram", "stage-3", "systemdenken"],
    sourceLink: `${ZAM_UML_TOPIC_KEY}#lesson=3.1`,
  },
  {
    id: "01K8M251SYST00000000000J07",
    atomId: "01K8M251SYST00000000000A04",
    stageId: "stage-4-state",
    stageNumber: 4,
    lessonStep: "4.2",
    lessonId: "stm-2-connections",
    tier: 1,
    title: {
      de: "Zustandsdiagramm: Übergangssyntax Ereignis [Guard] / Aktion",
      en: "State Machine: Transition syntax Event [Guard] / Action",
    },
    question: {
      de: "Aus welchen drei Teilen besteht die vollständige Beschriftung eines Zustandsübergangs im UML 2.5.1 Zustandsdiagramm?",
      en: "What are the three parts of a complete state transition label in a UML 2.5.1 State Machine Diagram?",
    },
    answer: {
      de: "`Ereignis [Wächterbedingung] / Aktion` — z. B. `pinEingegeben [pinKorrekt] / tuerEntriegeln`.\n1. Ereignis (Trigger)\n2. [Guard] in eckigen Klammern (Bedingung)\n3. / Aktion (wird beim Wechsel ausgeführt).",
      en: "`Event [Guard] / Action` — e.g. `pinEntered [pinValid] / unlockDoor`.\n1. Event (trigger)\n2. [Guard] in square brackets (condition)\n3. / Action (executed during transition).",
    },
    tags: ["uml-2.5.1", "state-machine", "stage-4", "systemdenken"],
    sourceLink: `${ZAM_UML_TOPIC_KEY}#lesson=4.2`,
  },
  {
    id: "01K8M251SYST00000000000J08",
    atomId: "01K8M251SYST00000000000A04",
    stageId: "stage-4-state",
    stageNumber: 4,
    lessonStep: "4.1",
    lessonId: "stm-1-boxes",
    tier: 2,
    title: {
      de: "Zustandsdiagramm: Interne Aktivitäten entry / do / exit",
      en: "State Machine: Internal behaviors entry / do / exit",
    },
    question: {
      de: "Wann werden die internen Aktivitäten `entry / ...`, `do / ...` und `exit / ...` innerhalb eines Zustands im UML 2.5.1 Zustandsdiagramm ausgeführt?",
      en: "When are the internal behaviors `entry / ...`, `do / ...`, and `exit / ...` inside a state executed in a UML 2.5.1 State Machine Diagram?",
    },
    answer: {
      de: "• `entry / ...`: Einmalig beim Betreten des Zustands.\n• `do / ...`: Fortlaufend, solange das Objekt in diesem Zustand verweilt.\n• `exit / ...`: Einmalig unmittelbar beim Verlassen des Zustands.",
      en: "• `entry / ...`: Executed once immediately upon entering the state.\n• `do / ...`: Ongoing activity while the object remains in the state.\n• `exit / ...`: Executed once right before leaving the state.",
    },
    tags: ["uml-2.5.1", "state-machine", "stage-4", "systemdenken"],
    sourceLink: `${ZAM_UML_TOPIC_KEY}#lesson=4.1`,
  },
  {
    id: "01K8M251SYST00000000000J09",
    atomId: "01K8M251SYST00000000000A05",
    stageId: "stage-5-sequence",
    stageNumber: 5,
    lessonStep: "5.2",
    lessonId: "seq-2-connections",
    tier: 1,
    title: {
      de: "Sequenzdiagramm: Synchrone (▸) vs. Asynchrone (>) vs. Antwort-Nachricht (- - >)",
      en: "Sequence Diagram: Synchronous (▸) vs. Asynchronous (>) vs. Reply Message (- - >)",
    },
    question: {
      de: "Woran erkennt man im UML 2.5.1 Sequenzdiagramm eine synchrone Nachricht, eine asynchrone Nachricht und eine Antwort-Nachricht?",
      en: "How do you distinguish a synchronous message, an asynchronous message, and a reply message in a UML 2.5.1 Sequence Diagram?",
    },
    answer: {
      de: "• Synchroner Aufruf (durchgezogen + gefülltes Dreieck ──▸): Sender wartet blockierend auf die Antwort.\n• Asynchrone Nachricht (durchgezogen + offene Pfeilspitze ──>): Sender arbeitet sofort weiter.\n• Antwort / Return (gestrichelt + offene Pfeilspitze - - >): Rückgabewert.",
      en: "• Synchronous call (solid line + filled triangle ──▸): Caller blocks and waits for reply.\n• Asynchronous message (solid line + open arrowhead ──>): Sender continues immediately.\n• Reply / Return (dashed line + open arrowhead - - >): Return value.",
    },
    tags: ["uml-2.5.1", "sequence-diagram", "stage-5", "systemdenken"],
    sourceLink: `${ZAM_UML_TOPIC_KEY}#lesson=5.2`,
  },
  {
    id: "01K8M251SYST00000000000J10",
    atomId: "01K8M251SYST00000000000A05",
    stageId: "stage-5-sequence",
    stageNumber: 5,
    lessonStep: "5.4",
    lessonId: "seq-4-capstone",
    tier: 2,
    title: {
      de: "Sequenzdiagramm: Kombinierte Fragmente (alt, opt, loop, par)",
      en: "Sequence Diagram: Combined Fragments (alt, opt, loop, par)",
    },
    question: {
      de: "Was bedeuten die Operatoren `alt`, `opt`, `loop` und `par` in einem Kombinierten Fragment eines UML 2.5.1 Sequenzdiagramms?",
      en: "What do the operators `alt`, `opt`, `loop`, and `par` mean in a Combined Fragment of a UML 2.5.1 Sequence Diagram?",
    },
    answer: {
      de: "• `alt`: Alternative Verzweigungen (if / else).\n• `opt`: Optionaler Ablauf (nur wenn [Guard] wahr ist).\n• `loop`: Wiederholung / Schleife.\n• `par`: Parallele Nachrichtenabläufe.",
      en: "• `alt`: Alternative branches (if / else).\n• `opt`: Optional block (executes only if [Guard] holds).\n• `loop`: Repeated execution.\n• `par`: Parallel execution of message sequences.",
    },
    tags: ["uml-2.5.1", "sequence-diagram", "stage-5", "systemdenken"],
    sourceLink: `${ZAM_UML_TOPIC_KEY}#lesson=5.4`,
  },
  {
    id: "01K8M251SYST00000000000J11",
    atomId: "01K8M251SYST00000000000A06",
    stageId: "stage-6-component",
    stageNumber: 6,
    lessonStep: "6.1",
    lessonId: "cmp-1-boxes",
    tier: 1,
    title: {
      de: "Komponentendiagramm: Lollipop (○—) vs. Socket ()—)",
      en: "Component Diagram: Lollipop (○—) vs. Socket ()—)",
    },
    question: {
      de: "Was bedeuten das Lollipop-Symbol (Kreis am Stiel ○—) und das Socket-Symbol (Greifer/Halbkreis ()—) im UML 2.5.1 Komponentendiagramm?",
      en: "What do the Lollipop symbol (circle on a stick ○—) and the Socket symbol (half-circle arc ()—) represent in a UML 2.5.1 Component Diagram?",
    },
    answer: {
      de: "• Lollipop (○—): Angebotene Schnittstelle (Provided Interface) — die Komponente stellt diesen Vertrag bereit.\n• Socket ()—): Benötigte Schnittstelle (Required Interface) — die Komponente benötigt einen Partner, der diese Schnittstelle anbietet.",
      en: "• Lollipop (○—): Provided Interface — the component implements and offers this contract.\n• Socket ()—): Required Interface — the component requires a partner providing this interface.",
    },
    tags: ["uml-2.5.1", "component-diagram", "stage-6", "systemdenken"],
    sourceLink: `${ZAM_UML_TOPIC_KEY}#lesson=6.1`,
  },
  {
    id: "01K8M251SYST00000000000J12",
    atomId: "01K8M251SYST00000000000A06",
    stageId: "stage-6-component",
    stageNumber: 6,
    lessonStep: "6.4",
    lessonId: "cmp-4-capstone",
    tier: 2,
    title: {
      de: "Systemdenken: Welches der 6 Kern-Diagramme beantwortet welche Systemfrage?",
      en: "Systems Thinking: Which of the 6 core diagrams answers which architectural question?",
    },
    question: {
      de: "Welches der 6 UML 2.5.1 Kern-Diagramme wählst du für: (1) Wer will was vom System? (2) Fachbegriffe & Datenstruktur? (3) Prozessablauf & Parallelität? (4) Lebenszyklus eines Objekts? (5) Zeitlicher Nachrichtenaustausch? (6) Modulare Architektur & Schnittstellen?",
      en: "Which of the 6 core UML 2.5.1 diagrams do you choose for: (1) Who wants what from the system? (2) Domain concepts & data structure? (3) Workflow & concurrency? (4) Object lifecycle? (5) Chronological message exchange? (6) Modular architecture & interfaces?",
    },
    answer: {
      de: "1. Use-Case-Diagramm\n2. Klassendiagramm\n3. Aktivitätsdiagramm\n4. Zustandsdiagramm\n5. Sequenzdiagramm\n6. Komponentendiagramm",
      en: "1. Use Case Diagram\n2. Class Diagram\n3. Activity Diagram\n4. State Machine Diagram\n5. Sequence Diagram\n6. Component Diagram",
    },
    tags: ["uml-2.5.1", "architecture", "stage-6", "systemdenken"],
    sourceLink: `${ZAM_UML_TOPIC_KEY}#lesson=6.4`,
  },
];

export interface ParsedTrainingDeepLink {
  lessonId?: string;
  level?: DifficultyLevel;
  locale?: AppLocale;
}

/**
 * Parses URL hash or query parameters like `#lesson=2.2`, `#lesson=cls-2-connections`,
 * or `?lesson=1.2&level=2&lang=en` so that clicking a `source_link` in ZAM
 * opens the exact interactive training lesson.
 */
export function parseTrainingDeepLink(
  hash: string,
  search = "",
): ParsedTrainingDeepLink {
  const result: ParsedTrainingDeepLink = {};
  const cleanHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const cleanSearch = search.startsWith("?") ? search.slice(1) : search;
  const combined = [cleanSearch, cleanHash].filter(Boolean).join("&");
  if (!combined) return result;

  const params = new URLSearchParams(combined);
  const rawLesson = params.get("lesson")?.trim();
  if (rawLesson) {
    if (LESSON_STEP_TO_ID[rawLesson]) {
      result.lessonId = LESSON_STEP_TO_ID[rawLesson];
    } else if (Object.values(LESSON_STEP_TO_ID).includes(rawLesson)) {
      result.lessonId = rawLesson;
    }
  }

  const rawLevel = params.get("level")?.trim();
  if (rawLevel === "1" || rawLevel === "2") {
    result.level = Number(rawLevel) as DifficultyLevel;
  }

  const rawLang = (params.get("lang") ?? params.get("locale"))
    ?.trim()
    .toLowerCase();
  if (rawLang === "de" || rawLang === "en") {
    result.locale = rawLang;
  }

  return result;
}

function escapeCsvField(value: string): string {
  const normalized = value.replace(/\r\n/g, "\n");
  if (
    normalized.includes(",") ||
    normalized.includes('"') ||
    normalized.includes("\n")
  ) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

/**
 * Builds a ZAM-compatible CSV file (`id,question,answer,title,deck,tags,source`)
 * matching `src/cli/import/delimited.ts` so learners can import the cards via
 * ZAM Studio (`Lerninhalte → Importieren → Datei importieren`) or CLI.
 */
export function buildZamCsvExport(
  locale: AppLocale = "de",
  filterStageIds?: string[],
): string {
  const header = "id,question,answer,title,deck,tags,source";
  const deckName =
    locale === "en"
      ? "UML 2.5.1 & Systems Thinking"
      : "UML 2.5.1 & Systemdenken";

  const cards =
    filterStageIds && filterStageIds.length > 0
      ? ZAM_PRACTICE_CARDS.filter((c) => filterStageIds.includes(c.stageId))
      : ZAM_PRACTICE_CARDS;

  const rows = cards.map((card) =>
    [
      escapeCsvField(card.id),
      escapeCsvField(card.question[locale]),
      escapeCsvField(card.answer[locale]),
      escapeCsvField(card.title[locale]),
      escapeCsvField(`${deckName}::Stage ${card.stageNumber}`),
      escapeCsvField(card.tags.join(",")),
      escapeCsvField(card.sourceLink),
    ].join(","),
  );

  return [header, ...rows].join("\n");
}

export function buildZamEnrolCliCommand(): string {
  return `zam bridge bundled-cell-enrol ${ZAM_UML_BUNDLED_CELL_ID}`;
}
