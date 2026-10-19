import type { ExerciseCriterion } from "../checker/graph-evaluator";
import type { AppLocale } from "../i18n/translations";
import type {
  UmlDiagram,
  UmlDiagramType,
  UmlEdgeKind,
  UmlNodeKind,
} from "../model/uml-types";
import { DE_LEVEL2_SCENARIOS, EN_LESSONS, EN_STAGES } from "./learning-path-en";

export type DifficultyLevel = 1 | 2;

export type LessonMode =
  | "guided-build"
  | "connections"
  | "bug-detective"
  | "capstone-mission";

export interface VisualCheckQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LearningLesson {
  id: string;
  stageId: string;
  stepNumber: number;
  mode: LessonMode;
  title: string;
  subtitle: string;
  whyItMatters: string;
  explanationHtml: string;
  visualCheck: VisualCheckQuestion;
  taskPrompt: string;
  level2ScenarioPrompt?: string;
  allowedNodes: UmlNodeKind[];
  allowedEdges: UmlEdgeKind[];
  starterDiagram: UmlDiagram;
  sampleSolutionDiagram: UmlDiagram;
  criteria: ExerciseCriterion[];
  celebrationMessage: string;
}

export interface LearningStage {
  id: string;
  stageNumber: number;
  diagramType: UmlDiagramType;
  title: string;
  subtitle: string;
  icon: string;
  colorAccent: string;
  badgeTitle: string;
  badgeIcon: string;
  expressionSkillSummary: string;
  celebrationHeadline: string;
  celebrationBody: string;
  unlockedElementsSummary: string[];
  lessons: LearningLesson[];
}

export const LEARNING_STAGES: LearningStage[] = [
  // =========================================================================
  // ETAPPE 1: ANWENDUNGSFALLDIAGRAMM (USE CASE)
  // =========================================================================
  {
    id: "stage-1-use-case",
    stageNumber: 1,
    diagramType: "use-case",
    title: "Etappe 1: Ideen abgrenzen & Nutzen zeigen",
    subtitle: "Das Anwendungsfalldiagramm (Use Case Diagram)",
    icon: "🎭",
    colorAccent: "#2563eb",
    badgeTitle: "Systemgrenzen-Pionier",
    badgeIcon: "🧭",
    expressionSkillSummary:
      "Du kannst auf einer Serviette oder im Meeting sofort klären, was zu einem System gehört, wer es nutzt und welchen konkreten Mehrwert es stiftet.",
    celebrationHeadline:
      "Etappe 1 gemeistert: Du beherrschst den Blick von außen!",
    celebrationBody:
      "Wer ein System beschreiben will, fängt nicht bei Datenbanktabellen an, sondern bei der Grenze zwischen Welt und System. Du kannst jetzt Akteure, Systemgrenzen, Anwendungsfälle sowie «include» und «extend» glasklar ausdrücken!",
    unlockedElementsSummary: [
      "Akteur (Strichmännchen außerhalb des Systems)",
      "Systemgrenze (Rechteck-Rahmen für das System)",
      "Anwendungsfall (Ellipse für ein Nutzerziel)",
      "Assoziation, «include» (Pflicht-Teilschritt) & «extend» (Optionale Erweiterung)",
    ],
    lessons: [
      {
        id: "uc-1-boxes",
        stageId: "stage-1-use-case",
        stepNumber: 1,
        mode: "guided-build",
        title: "1.1 Innen vs. Außen: Systemgrenze, Akteur & Anwendungsfall",
        subtitle: "Die drei Grundelemente jedes Use-Case-Diagramms",
        whyItMatters:
          "Die häufigste Ursache für Missverständnisse in Projekten ist Unklarheit darüber, wo das System aufhört und wer eigentlich damit arbeitet.",
        explanationHtml: `
          <p>Ein <strong>Anwendungsfalldiagramm</strong> beantwortet zwei fundamentale Fragen auf einen Blick:</p>
          <ul>
            <li><strong>Die Systemgrenze (Rechteck-Rahmen):</strong> Zieht eine klare Mauer um dein System. Alles <em>innerhalb</em> des Rahmens müssen wir bauen.</li>
            <li><strong>Der Akteur (Strichmännchen):</strong> Eine Rolle außerhalb des Systems (ein Mensch wie <code>Fahrgast</code> oder ein Nachbarsystem wie <code>Bankserver</code>). <strong>Goldene Regel:</strong> Akteure stehen immer <em>außerhalb</em> der Systemgrenze!</li>
            <li><strong>Der Anwendungsfall (Ellipse):</strong> Ein konkretes Ziel aus Sicht des Akteurs, formuliert mit <em>Substantiv + Verb</em> (z. B. <code>Ticket kaufen</code>). Er liegt <em>innerhalb</em> der Systemgrenze.</li>
          </ul>
        `,
        visualCheck: {
          question:
            "Wo muss ein Akteur (z. B. „Fahrgast“) in einem korrekten UML-2.5.1-Anwendungsfalldiagramm platziert werden?",
          options: [
            "Immer außerhalb der Systemgrenze, da er nicht Teil des gebauten Systems ist",
            "Immer mitten in der Systemgrenze neben den Anwendungsfällen",
            "Innerhalb einer Klasse als Attribut",
          ],
          correctIndex: 0,
          explanation:
            "Genau! Die Systemgrenze umschließt nur die Anwendungsfälle des Systems. Akteure interagieren von außen mit dem System.",
        },
        taskPrompt:
          "Platziere eine Systemgrenze (z. B. „Fahrkartenautomat“), lege einen Akteur „Fahrgast“ außerhalb davon an und platziere den Anwendungsfall „Ticket kaufen“ innerhalb der Systemgrenze.",
        allowedNodes: ["system-boundary", "actor", "use-case"],
        allowedEdges: [],
        starterDiagram: {
          id: "uc-1-starter",
          title: "Fahrkartenautomat – Grundelemente",
          diagramType: "use-case",
          nodes: [
            {
              id: "uc1_boundary",
              kind: "system-boundary",
              name: "Fahrkartenautomat",
              stereotype: "system",
              x: 240,
              y: 60,
              width: 360,
              height: 260,
              attributes: [],
              operations: [],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "uc-1-solution",
          title: "Fahrkartenautomat – Grundelemente",
          diagramType: "use-case",
          nodes: [
            {
              id: "uc1_boundary",
              kind: "system-boundary",
              name: "Fahrkartenautomat",
              stereotype: "system",
              x: 240,
              y: 60,
              width: 360,
              height: 260,
              attributes: [],
              operations: [],
            },
            {
              id: "uc1_actor",
              kind: "actor",
              name: "Fahrgast",
              x: 70,
              y: 135,
              width: 90,
              height: 110,
              attributes: [],
              operations: [],
            },
            {
              id: "uc1_uc",
              kind: "use-case",
              name: "Ticket kaufen",
              x: 330,
              y: 150,
              width: 180,
              height: 74,
              attributes: [],
              operations: [],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "node",
            id: "uc1-boundary",
            description:
              "Systemgrenze (z. B. „Fahrkartenautomat“) ist vorhanden",
            nodeKind: "system-boundary",
            hintOnMissing:
              "Füge eine Systemgrenze aus der Werkzeugleiste hinzu.",
          },
          {
            type: "node",
            id: "uc1-actor",
            description:
              "Akteur „Fahrgast“ (oder „Kunde“) steht außerhalb der Systemgrenze",
            nodeKind: "actor",
            acceptedNames: ["Fahrgast", "Kunde", "Reisender", "Nutzer"],
            mustBeOutsideKind: "system-boundary",
            hintOnMissing:
              "Platziere einen Akteur „Fahrgast“ links außerhalb der Systemgrenze.",
          },
          {
            type: "node",
            id: "uc1-usecase",
            description:
              "Anwendungsfall „Ticket kaufen“ liegt innerhalb der Systemgrenze",
            nodeKind: "use-case",
            acceptedNames: [
              "Ticket kaufen",
              "Fahrkarte kaufen",
              "Ticket buchen",
            ],
            mustBeInsideKind: "system-boundary",
            hintOnMissing:
              "Platziere einen Anwendungsfall „Ticket kaufen“ mitten in den Rahmen der Systemgrenze.",
          },
        ],
        celebrationMessage:
          "Klasse! Du hast Innen (Anwendungsfall im System) und Außen (Akteur) sauber getrennt.",
      },
      {
        id: "uc-2-connections",
        stageId: "stage-1-use-case",
        stepNumber: 2,
        mode: "connections",
        title: "1.2 Verbindungen: Assoziation, «include» & «extend»",
        subtitle: "Wie Akteure und Anwendungsfälle zusammenhängen",
        whyItMatters:
          "Mit «include» und «extend» zeigst du, welche Abläufe zwingend zu einem Ziel gehören und welche nur optionale Extras sind.",
        explanationHtml: `
          <p>Im Anwendungsfalldiagramm gibt es drei wichtige Verbindungsarten:</p>
          <ul>
            <li><strong>Assoziation (durchgezogene Linie <code>──</code>):</strong> Verbindet einen Akteur mit dem Anwendungsfall, an dem er beteiligt ist.</li>
            <li><strong><code>«include»</code> (gestrichelter Pfeil <code>- - &gt;</code>):</strong> Pflicht-Einbindung! Der Pfeil zeigt vom <strong>Haupt-Use-Case zum immer mit ausgeführten Teil-Use-Case</strong> (z. B. <code>Ticket kaufen ──«include»──&gt; Bezahlen</code>).</li>
            <li><strong><code>«extend»</code> (gestrichelter Pfeil <code>- - &gt;</code>):</strong> Optionale Erweiterung! <em>Aufgepasst bei der Pfeilrichtung:</em> Der Pfeil zeigt vom <strong>optionalen Zusatz hin zum Basis-Use-Case</strong> (z. B. <code>Rabattcode einlösen ──«extend»──&gt; Ticket kaufen</code>).</li>
          </ul>
        `,
        visualCheck: {
          question:
            "Beim Anwendungsfall „Ticket kaufen“ wird JEDES MAL zwingend auch „Bezahlen“ ausgeführt. Welcher Pfeil ist nach UML 2.5.1 richtig?",
          options: [
            "Ein «include»-Pfeil von „Ticket kaufen“ hin zu „Bezahlen“",
            "Ein «extend»-Pfeil von „Ticket kaufen“ hin zu „Bezahlen“",
            "Ein Vererbungspfeil von „Bezahlen“ zu „Ticket kaufen“",
          ],
          correctIndex: 0,
          explanation:
            "Richtig! Bei «include» zeigt der Pfeil vom Basis-Anwendungsfall («Ticket kaufen») auf den zwingend enthaltenen Teilschritt («Bezahlen»).",
        },
        taskPrompt:
          "1. Verbinde „Fahrgast“ per Assoziation mit „Ticket kaufen“. 2. Ziehe einen «include»-Pfeil von „Ticket kaufen“ zu „Bezahlen“. 3. Ziehe einen «extend»-Pfeil von „Bahncard-Rabatt nutzen“ zu „Ticket kaufen“.",
        allowedNodes: ["system-boundary", "actor", "use-case"],
        allowedEdges: ["association", "include", "extend"],
        starterDiagram: {
          id: "uc-2-starter",
          title: "Fahrkartenautomat – Verbindungen",
          diagramType: "use-case",
          nodes: [
            {
              id: "uc2_boundary",
              kind: "system-boundary",
              name: "Fahrkartenautomat",
              stereotype: "system",
              x: 220,
              y: 40,
              width: 450,
              height: 330,
              attributes: [],
              operations: [],
            },
            {
              id: "uc2_actor",
              kind: "actor",
              name: "Fahrgast",
              x: 55,
              y: 145,
              width: 90,
              height: 110,
              attributes: [],
              operations: [],
            },
            {
              id: "uc2_main",
              kind: "use-case",
              name: "Ticket kaufen",
              x: 255,
              y: 155,
              width: 170,
              height: 74,
              attributes: [],
              operations: [],
            },
            {
              id: "uc2_pay",
              kind: "use-case",
              name: "Bezahlen",
              x: 475,
              y: 85,
              width: 165,
              height: 70,
              attributes: [],
              operations: [],
            },
            {
              id: "uc2_discount",
              kind: "use-case",
              name: "Bahncard-Rabatt nutzen",
              x: 465,
              y: 235,
              width: 185,
              height: 74,
              attributes: [],
              operations: [],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "uc-2-solution",
          title: "Fahrkartenautomat – Verbindungen",
          diagramType: "use-case",
          nodes: [
            {
              id: "uc2_boundary",
              kind: "system-boundary",
              name: "Fahrkartenautomat",
              stereotype: "system",
              x: 220,
              y: 40,
              width: 450,
              height: 330,
              attributes: [],
              operations: [],
            },
            {
              id: "uc2_actor",
              kind: "actor",
              name: "Fahrgast",
              x: 55,
              y: 145,
              width: 90,
              height: 110,
              attributes: [],
              operations: [],
            },
            {
              id: "uc2_main",
              kind: "use-case",
              name: "Ticket kaufen",
              x: 255,
              y: 155,
              width: 170,
              height: 74,
              attributes: [],
              operations: [],
            },
            {
              id: "uc2_pay",
              kind: "use-case",
              name: "Bezahlen",
              x: 475,
              y: 85,
              width: 165,
              height: 70,
              attributes: [],
              operations: [],
            },
            {
              id: "uc2_discount",
              kind: "use-case",
              name: "Bahncard-Rabatt nutzen",
              x: 465,
              y: 235,
              width: 185,
              height: 74,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "uc2_e1",
              kind: "association",
              sourceId: "uc2_actor",
              targetId: "uc2_main",
            },
            {
              id: "uc2_e2",
              kind: "include",
              sourceId: "uc2_main",
              targetId: "uc2_pay",
              stereotype: "include",
            },
            {
              id: "uc2_e3",
              kind: "extend",
              sourceId: "uc2_discount",
              targetId: "uc2_main",
              stereotype: "extend",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "edge",
            id: "uc2-assoc",
            description: "Assoziation zwischen „Fahrgast“ und „Ticket kaufen“",
            edgeKind: "association",
            sourceNodeNames: ["Fahrgast"],
            targetNodeNames: ["Ticket kaufen"],
            allowReverseForUndirected: true,
            hintOnMissing:
              "Wähle das Verbindungswerkzeug „Assoziation“ und ziehe eine Linie von „Fahrgast“ zu „Ticket kaufen“.",
          },
          {
            type: "edge",
            id: "uc2-include",
            description:
              "«include»-Pfeil zeigt von „Ticket kaufen“ auf „Bezahlen“",
            edgeKind: "include",
            sourceNodeNames: ["Ticket kaufen"],
            targetNodeNames: ["Bezahlen"],
            hintOnMissing:
              "Wähle „«include»“ und ziehe den Pfeil von „Ticket kaufen“ hin zu „Bezahlen“.",
          },
          {
            type: "edge",
            id: "uc2-extend",
            description:
              "«extend»-Pfeil zeigt von „Bahncard-Rabatt nutzen“ auf „Ticket kaufen“",
            edgeKind: "extend",
            sourceNodeNames: ["Bahncard-Rabatt", "Rabatt"],
            targetNodeNames: ["Ticket kaufen"],
            hintOnMissing:
              "Wähle „«extend»“ und ziehe den Pfeil vom optionalen „Bahncard-Rabatt nutzen“ hin zum Basis-Anwendungsfall „Ticket kaufen“.",
          },
        ],
        celebrationMessage:
          "Perfekt! Du kennst jetzt den entscheidenden Richtungs-Unterschied zwischen «include» und «extend».",
      },
      {
        id: "uc-3-detective",
        stageId: "stage-1-use-case",
        stepNumber: 3,
        mode: "bug-detective",
        title: "1.3 Fehler-Detektiv: Das verdrehte Online-Banking",
        subtitle: "Finde und repariere zwei typische Use-Case-Fehler",
        whyItMatters:
          "Wer Fehler in fremden Diagrammen sofort erkennt, hat die visuelle Grammatik wirklich verinnerlicht.",
        explanationHtml: `
          <p>Ein Kollege hat ein Use-Case-Diagramm für eine <strong>Banking-App</strong> gezeichnet – aber es stecken <strong>zwei klassische Fehler</strong> darin:</p>
          <ol>
            <li>Der Akteur <code>Bankkunde</code> wurde versehentlich <strong>in die Systemgrenze hinein</strong> gesetzt.</li>
            <li>Der <code>«extend»</code>-Pfeil zwischen <code>Überweisung tätigen</code> und dem optionalen <code>Spendenbeleg drucken</code> zeigt in die <strong>falsche Richtung</strong>! (Erinnerung: Der optionale Erweiterungs-Use-Case zeigt mit <code>«extend»</code> auf den Basis-Use-Case).</li>
          </ol>
        `,
        visualCheck: {
          question:
            "Wenn „Spendenbeleg drucken“ eine optionale Erweiterung von „Überweisung tätigen“ ist: Wohin muss die Pfeilspitze von «extend» zeigen?",
          options: [
            "Auf „Überweisung tätigen“ (den Basis-Anwendungsfall)",
            "Auf „Spendenbeleg drucken“",
            "Auf den Akteur „Bankkunde“",
          ],
          correctIndex: 0,
          explanation:
            "Genau: Die Erweiterung («Spendenbeleg drucken») kennt den Basisfall («Überweisung tätigen») und zeigt mit «extend» auf ihn!",
        },
        taskPrompt:
          "Repariere das Diagramm im Editor: 1. Ziehe den Akteur „Bankkunde“ nach links AUSSERHALB der Systemgrenze. 2. Klicke den «extend»-Pfeil an und kehre seine Richtung um (Button „Richtung umkehren ⇄“ rechts im Inspektor).",
        allowedNodes: ["system-boundary", "actor", "use-case"],
        allowedEdges: ["association", "include", "extend"],
        starterDiagram: {
          id: "uc-3-starter",
          title: "Banking-App (Fehlerhaft)",
          diagramType: "use-case",
          nodes: [
            {
              id: "uc3_boundary",
              kind: "system-boundary",
              name: "Online-Banking",
              stereotype: "system",
              x: 180,
              y: 40,
              width: 480,
              height: 320,
              attributes: [],
              operations: [],
            },
            {
              id: "uc3_actor",
              kind: "actor",
              name: "Bankkunde",
              x: 215,
              y: 140,
              width: 90,
              height: 110,
              attributes: [],
              operations: [],
            },
            {
              id: "uc3_transfer",
              kind: "use-case",
              name: "Überweisung tätigen",
              x: 345,
              y: 95,
              width: 185,
              height: 74,
              attributes: [],
              operations: [],
            },
            {
              id: "uc3_receipt",
              kind: "use-case",
              name: "Spendenbeleg drucken",
              x: 345,
              y: 235,
              width: 195,
              height: 74,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "uc3_e1",
              kind: "association",
              sourceId: "uc3_actor",
              targetId: "uc3_transfer",
            },
            {
              id: "uc3_e2_bug",
              kind: "extend",
              sourceId: "uc3_transfer",
              targetId: "uc3_receipt",
              stereotype: "extend",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "uc-3-solution",
          title: "Banking-App (Repariert)",
          diagramType: "use-case",
          nodes: [
            {
              id: "uc3_boundary",
              kind: "system-boundary",
              name: "Online-Banking",
              stereotype: "system",
              x: 180,
              y: 40,
              width: 480,
              height: 320,
              attributes: [],
              operations: [],
            },
            {
              id: "uc3_actor",
              kind: "actor",
              name: "Bankkunde",
              x: 45,
              y: 140,
              width: 90,
              height: 110,
              attributes: [],
              operations: [],
            },
            {
              id: "uc3_transfer",
              kind: "use-case",
              name: "Überweisung tätigen",
              x: 345,
              y: 95,
              width: 185,
              height: 74,
              attributes: [],
              operations: [],
            },
            {
              id: "uc3_receipt",
              kind: "use-case",
              name: "Spendenbeleg drucken",
              x: 345,
              y: 235,
              width: 195,
              height: 74,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "uc3_e1",
              kind: "association",
              sourceId: "uc3_actor",
              targetId: "uc3_transfer",
            },
            {
              id: "uc3_e2_fixed",
              kind: "extend",
              sourceId: "uc3_receipt",
              targetId: "uc3_transfer",
              stereotype: "extend",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "node",
            id: "uc3-actor-out",
            description: "Akteur „Bankkunde“ steht außerhalb der Systemgrenze",
            nodeKind: "actor",
            acceptedNames: ["Bankkunde"],
            mustBeOutsideKind: "system-boundary",
            hintOnMissing:
              "Ziehe das Strichmännchen „Bankkunde“ mit der Maus nach links aus dem Rahmen „Online-Banking“ heraus.",
          },
          {
            type: "edge",
            id: "uc3-extend-fixed",
            description:
              "«extend»-Pfeil zeigt von „Spendenbeleg drucken“ zu „Überweisung tätigen“",
            edgeKind: "extend",
            sourceNodeNames: ["Spendenbeleg drucken"],
            targetNodeNames: ["Überweisung tätigen"],
            hintOnMissing:
              "Klicke den «extend»-Pfeil an und klicke rechts im Inspektor auf „Richtung umkehren ⇄“.",
          },
        ],
        celebrationMessage:
          "Scharfes Auge! Beide Modellierungsfehler wurden sauber behoben.",
      },
      {
        id: "uc-4-capstone",
        stageId: "stage-1-use-case",
        stepNumber: 4,
        mode: "capstone-mission",
        title: "1.4 Etappen-Finale: Das Smart-Home-Türschloss",
        subtitle: "Deine erste komplette Systemverständnis-Mission",
        whyItMatters:
          "Jetzt beweist du, dass du eine reale Produktidee in ein klares Use-Case-Diagramm übersetzen kannst.",
        explanationHtml: `
          <p><strong>Deine Mission:</strong> Modelliere ein <strong>Smart-Home-Türschloss</strong> nach folgenden Anforderungen:</p>
          <ul>
            <li>Es gibt eine Systemgrenze (z. B. <code>SmartLock</code>).</li>
            <li>Ein Akteur <code>Bewohner</code> steht außerhalb der Systemgrenze.</li>
            <li>Der Bewohner nutzt den Anwendungsfall <code>Tür entriegeln</code> (innerhalb der Systemgrenze).</li>
            <li>Bei jedem <code>Tür entriegeln</code> wird zwingend <code>Zugangscode prüfen</code> per <code>«include»</code> eingebunden.</li>
            <li>Optional kann beim Entriegeln <code>Alarm auslösen</code> per <code>«extend»</code> eintreten (bei Fehlversuchen).</li>
          </ul>
        `,
        visualCheck: {
          question:
            "Warum modellieren wir „Zugangscode prüfen“ als eigenen «include»-Anwendungsfall statt es wegzulassen?",
          options: [
            "Weil dieser Prüfschritt zentral ist und auch von anderen Anwendungsfällen (z. B. „Einstellungen ändern“) wiederverwendet werden kann",
            "Weil ein Use-Case-Diagramm mindestens 5 Ellipsen haben muss",
            "Weil Akteure nur mit «include»-Pfeilen verbunden werden dürfen",
          ],
          correctIndex: 0,
          explanation:
            "Exakt! «include» macht gemeinsame Pflicht-Bausteine explizit und wiederverwendbar.",
        },
        taskPrompt:
          "Modelliere das Smart-Home-Türschloss mit allen 5 Kriterien der Checkliste.",
        allowedNodes: ["system-boundary", "actor", "use-case", "note"],
        allowedEdges: ["association", "include", "extend", "note-link"],
        starterDiagram: {
          id: "uc-4-starter",
          title: "Smart-Home-Türschloss",
          diagramType: "use-case",
          nodes: [
            {
              id: "uc4_boundary",
              kind: "system-boundary",
              name: "SmartLock-System",
              stereotype: "system",
              x: 210,
              y: 40,
              width: 450,
              height: 320,
              attributes: [],
              operations: [],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "uc-4-solution",
          title: "Smart-Home-Türschloss",
          diagramType: "use-case",
          nodes: [
            {
              id: "uc4_boundary",
              kind: "system-boundary",
              name: "SmartLock-System",
              stereotype: "system",
              x: 210,
              y: 40,
              width: 450,
              height: 320,
              attributes: [],
              operations: [],
            },
            {
              id: "uc4_actor",
              kind: "actor",
              name: "Bewohner",
              x: 55,
              y: 145,
              width: 90,
              height: 110,
              attributes: [],
              operations: [],
            },
            {
              id: "uc4_unlock",
              kind: "use-case",
              name: "Tür entriegeln",
              x: 245,
              y: 155,
              width: 170,
              height: 74,
              attributes: [],
              operations: [],
            },
            {
              id: "uc4_check",
              kind: "use-case",
              name: "Zugangscode prüfen",
              x: 465,
              y: 80,
              width: 175,
              height: 74,
              attributes: [],
              operations: [],
            },
            {
              id: "uc4_alarm",
              kind: "use-case",
              name: "Alarm auslösen",
              x: 465,
              y: 235,
              width: 175,
              height: 74,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "uc4_e1",
              kind: "association",
              sourceId: "uc4_actor",
              targetId: "uc4_unlock",
            },
            {
              id: "uc4_e2",
              kind: "include",
              sourceId: "uc4_unlock",
              targetId: "uc4_check",
              stereotype: "include",
            },
            {
              id: "uc4_e3",
              kind: "extend",
              sourceId: "uc4_alarm",
              targetId: "uc4_unlock",
              stereotype: "extend",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "node",
            id: "uc4-actor",
            description:
              "Akteur „Bewohner“ (außerhalb der Systemgrenze) ist angelegt",
            nodeKind: "actor",
            acceptedNames: ["Bewohner", "Nutzer", "Eigentümer", "Gast"],
            mustBeOutsideKind: "system-boundary",
            hintOnMissing:
              "Lege einen Akteur „Bewohner“ links außerhalb der Systemgrenze an.",
          },
          {
            type: "node",
            id: "uc4-unlock",
            description:
              "Anwendungsfall „Tür entriegeln“ liegt innerhalb der Systemgrenze",
            nodeKind: "use-case",
            acceptedNames: ["Tür entriegeln", "Tür öffnen", "Entriegeln"],
            mustBeInsideKind: "system-boundary",
            hintOnMissing:
              "Platziere den Anwendungsfall „Tür entriegeln“ innerhalb der Systemgrenze.",
          },
          {
            type: "edge",
            id: "uc4-assoc",
            description: "Assoziation zwischen „Bewohner“ und „Tür entriegeln“",
            edgeKind: "association",
            sourceNodeNames: ["Bewohner", "Nutzer", "Eigentümer"],
            targetNodeNames: ["Tür entriegeln", "Tür öffnen", "Entriegeln"],
            allowReverseForUndirected: true,
            hintOnMissing:
              "Verbinde „Bewohner“ per Assoziation mit „Tür entriegeln“.",
          },
          {
            type: "edge",
            id: "uc4-include",
            description:
              "«include» von „Tür entriegeln“ zu „Zugangscode prüfen“",
            edgeKind: "include",
            sourceNodeNames: ["Tür entriegeln", "Tür öffnen", "Entriegeln"],
            targetNodeNames: [
              "Zugangscode prüfen",
              "Code prüfen",
              "PIN prüfen",
            ],
            hintOnMissing:
              "Lege den Use Case „Zugangscode prüfen“ an und ziehe einen «include»-Pfeil von „Tür entriegeln“ dorthin.",
          },
          {
            type: "edge",
            id: "uc4-extend",
            description: "«extend» von „Alarm auslösen“ zu „Tür entriegeln“",
            edgeKind: "extend",
            sourceNodeNames: ["Alarm auslösen", "Alarm"],
            targetNodeNames: ["Tür entriegeln", "Tür öffnen", "Entriegeln"],
            hintOnMissing:
              "Lege den Use Case „Alarm auslösen“ an und ziehe einen «extend»-Pfeil von „Alarm auslösen“ zu „Tür entriegeln“.",
          },
        ],
        celebrationMessage:
          "Herzlichen Glückwunsch zum Abschluss von Etappe 1!",
      },
    ],
  },

  // =========================================================================
  // ETAPPE 2: KLASSENDIAGRAMM (CLASS DIAGRAM)
  // =========================================================================
  {
    id: "stage-2-class",
    stageNumber: 2,
    diagramType: "class",
    title: "Etappe 2: Begriffe & Strukturen schärfen",
    subtitle: "Das Klassendiagramm (Class Diagram)",
    icon: "🏛️",
    colorAccent: "#7c3aed",
    badgeTitle: "Domänen-Architekt",
    badgeIcon: "🏛️",
    expressionSkillSummary:
      "Du kannst die Fachbegriffe jedes Systems, ihre Eigenschaften sowie Vererbung, Schnittstellen und Teil-Ganzes-Beziehungen unmissverständlich modellieren.",
    celebrationHeadline:
      "Etappe 2 gemeistert: Deine Strukturmodelle sprechen UML 2.5.1!",
    celebrationBody:
      "Du beherrschst Klassen mit Sichtbarkeiten (+, -, #), Schnittstellen («interface»), Multiplizitäten sowie den feinen, aber entscheidenden Unterschied zwischen Aggregation (◇) und Komposition (◆)!",
    unlockedElementsSummary: [
      "Klasse (3 Abteile: Name, Attribute, Operationen) & Sichtbarkeiten (+, -, #, ~)",
      "Schnittstelle («interface») & Abstrakte Klasse",
      "Aggregation (leere Raute ◇) vs. Komposition (ausgefüllte Raute ◆)",
      "Generalisierung/Vererbung (──▷) & Realisierung (- - ▷)",
    ],
    lessons: [
      {
        id: "cls-1-boxes",
        stageId: "stage-2-class",
        stepNumber: 1,
        mode: "guided-build",
        title: "2.1 Die Anatomie einer Klasse & Schnittstelle",
        subtitle: "Drei Abteile, Sichtbarkeiten (+ / -) und «interface»",
        whyItMatters:
          "Wenn Menschen aneinander vorbeireden, meinen sie mit demselben Wort oft verschiedene Dinge. Eine UML-Klasse macht jeden Begriff konkret.",
        explanationHtml: `
          <p>Eine <strong>Klasse</strong> besteht in UML 2.5.1 aus einem Rechteck mit drei Abteilen (Kompartimenten):</p>
          <ol>
            <li><strong>Kopf:</strong> Klassenname im Singular (z. B. <code>Buch</code>), optional mit Stereotyp wie <code>«interface»</code>.</li>
            <li><strong>Attribute (Eigenschaften):</strong> Format <code>Sichtbarkeit name : Typ</code>, z. B. <code>- titel : String</code>. Dabei steht <code>-</code> für <em>private</em> (gekapselt) und <code>+</code> für <em>public</em> (öffentlich).</li>
            <li><strong>Operationen (Verhalten):</strong> Format <code>+ ausleihen() : boolean</code>.</li>
          </ol>
        `,
        visualCheck: {
          question:
            "Was bedeutet das Minuszeichen in der Attributzeile „- kontostand : Euro“ einer UML-Klasse?",
          options: [
            "Das Attribut ist privat (private) und von außen nicht direkt ohne Methode veränderbar",
            "Der Kontostand ist negativ",
            "Das Attribut wurde gelöscht",
          ],
          correctIndex: 0,
          explanation:
            "Richtig! `-` steht in UML für `private` (Daten-Kapselung), `+` für `public`, `#` für `protected` und `~` für `package`.",
        },
        taskPrompt:
          "Erstelle eine Klasse „Buch“ mit mindestens 2 Attributen (z. B. „titel“ und „isbn“) und mindestens 1 Operation sowie eine Schnittstelle „Ausleihbar“ («interface»).",
        allowedNodes: ["class", "interface"],
        allowedEdges: [],
        starterDiagram: {
          id: "cls-1-starter",
          title: "Bibliothek – Klassen & Schnittstellen",
          diagramType: "class",
          nodes: [],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "cls-1-solution",
          title: "Bibliothek – Klassen & Schnittstellen",
          diagramType: "class",
          nodes: [
            {
              id: "cls1_book",
              kind: "class",
              name: "Buch",
              x: 110,
              y: 100,
              width: 200,
              height: 130,
              attributes: [
                {
                  id: "a1",
                  visibility: "-",
                  name: "titel",
                  type: "String",
                },
                {
                  id: "a2",
                  visibility: "-",
                  name: "isbn",
                  type: "String",
                },
              ],
              operations: [
                {
                  id: "o1",
                  visibility: "+",
                  name: "istVerfuegbar",
                  parameters: "",
                  returnType: "boolean",
                },
              ],
            },
            {
              id: "cls1_ifc",
              kind: "interface",
              name: "Ausleihbar",
              stereotype: "interface",
              isAbstract: true,
              x: 410,
              y: 100,
              width: 200,
              height: 115,
              attributes: [],
              operations: [
                {
                  id: "o2",
                  visibility: "+",
                  name: "ausleihen",
                  parameters: "",
                  returnType: "boolean",
                  isAbstract: true,
                },
              ],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "node",
            id: "cls1-book",
            description:
              "Klasse „Buch“ mit mindestens 2 Attributen und 1 Operation",
            nodeKind: "class",
            acceptedNames: ["Buch"],
            minAttributes: 2,
            minOperations: 1,
            hintOnMissing:
              "Platziere eine Klasse, nenne sie „Buch“ und achte darauf, dass sie mindestens 2 Attribute und 1 Operation hat.",
          },
          {
            type: "node",
            id: "cls1-ifc",
            description:
              "Schnittstelle „Ausleihbar“ («interface») ist vorhanden",
            nodeKind: "interface",
            acceptedNames: ["Ausleihbar", "IAusleihbar", "Medium"],
            hintOnMissing:
              "Platziere eine Schnittstelle («interface») aus der Werkzeugleiste und nenne sie „Ausleihbar“.",
          },
        ],
        celebrationMessage:
          "Stark! Deine ersten echten UML-2.5.1-Klassen und Schnittstellen stehen.",
      },
      {
        id: "cls-2-connections",
        stageId: "stage-2-class",
        stepNumber: 2,
        mode: "connections",
        title:
          "2.2 Beziehungen: Komposition (◆), Aggregation (◇) & Vererbung (▷)",
        subtitle: "Die feinen Bedeutungsunterschiede der UML-Pfeile",
        whyItMatters:
          "Ob ein Teil ohne sein Ganzes weiterleben kann (Aggregation ◇) oder mit ihm untergeht (Komposition ◆), entscheidet über die gesamte Systemlogik!",
        explanationHtml: `
          <p>Lerne die vier wichtigsten Strukturbeziehungen zu unterscheiden:</p>
          <ul>
            <li><strong>Komposition (<code>◆──</code> ausgefüllte Raute am Ganzen):</strong> Existenzabhängigkeit! Eine <code>Bestellposition</code> kann ohne ihre <code>Bestellung</code> nicht existieren. Wird die Bestellung gelöscht, verschwinden auch ihre Positionen.</li>
            <li><strong>Aggregation (<code>◇──</code> leere Raute am Ganzen):</strong> Lose Teil-Ganzes-Beziehung! Ein <code>Produkt</code> kann in einem <code>Katalog</code> sein, existiert aber auch weiter, wenn der Katalog gelöscht wird.</li>
            <li><strong>Vererbung / Generalisierung (<code>──▷</code> durchgezogen, hohles Dreieck):</strong> „Ist-ein“: <code>EBook ──▷ Buch</code>.</li>
            <li><strong>Realisierung (<code>- - ▷</code> gestrichelt, hohles Dreieck):</strong> Klasse setzt eine Schnittstelle um: <code>Buch - - ▷ «interface» Ausleihbar</code>.</li>
          </ul>
          <p><strong>Eselsbrücke für Rauten:</strong> Die Raute (◇ oder ◆) klebt <em>immer</em> am <strong>Ganzen</strong> (also an der Quelle beim Ziehen von Ganzes → Teil)!</p>
        `,
        visualCheck: {
          question:
            "Ein „Haus“ besteht aus mehreren „Räumen“. Ohne das Haus existiert kein einzelner Raum weiter. Welche Verbindung und Richtung ist korrekt?",
          options: [
            "Komposition (ausgefüllte Raute ◆ am „Haus“, Linie führt zu „Raum“)",
            "Aggregation (leere Raute ◇ am „Raum“, Linie führt zu „Haus“)",
            "Vererbung (Dreieckspfeil von „Haus“ zu „Raum“)",
          ],
          correctIndex: 0,
          explanation:
            "Volltreffer! Starke Existenzabhängigkeit = Komposition (◆), und die Raute sitzt immer am Ganzen („Haus“).",
        },
        taskPrompt:
          "Verbinde die vorbereiteten Elemente: 1. „Bestellung“ ◆── „Bestellposition“ per Komposition (Raute an Bestellung!). 2. „EBook“ ──▷ „Buch“ per Vererbung. 3. „Buch“ - - ▷ „Ausleihbar“ per Schnittstellen-Realisierung.",
        allowedNodes: ["class", "interface"],
        allowedEdges: [
          "composition",
          "aggregation",
          "generalization",
          "realization",
        ],
        starterDiagram: {
          id: "cls-2-starter",
          title: "Buchshop – Beziehungen",
          diagramType: "class",
          nodes: [
            {
              id: "cls2_order",
              kind: "class",
              name: "Bestellung",
              x: 60,
              y: 60,
              width: 185,
              height: 110,
              attributes: [
                { id: "a1", visibility: "-", name: "datum", type: "Date" },
              ],
              operations: [],
            },
            {
              id: "cls2_item",
              kind: "class",
              name: "Bestellposition",
              x: 60,
              y: 235,
              width: 185,
              height: 110,
              attributes: [
                { id: "a2", visibility: "-", name: "menge", type: "int" },
              ],
              operations: [],
            },
            {
              id: "cls2_book",
              kind: "class",
              name: "Buch",
              x: 340,
              y: 60,
              width: 185,
              height: 110,
              attributes: [
                { id: "a3", visibility: "-", name: "titel", type: "String" },
              ],
              operations: [],
            },
            {
              id: "cls2_ebook",
              kind: "class",
              name: "EBook",
              x: 340,
              y: 235,
              width: 185,
              height: 110,
              attributes: [
                {
                  id: "a4",
                  visibility: "-",
                  name: "dateiGroesseMB",
                  type: "float",
                },
              ],
              operations: [],
            },
            {
              id: "cls2_ifc",
              kind: "interface",
              name: "Ausleihbar",
              stereotype: "interface",
              isAbstract: true,
              x: 590,
              y: 60,
              width: 180,
              height: 105,
              attributes: [],
              operations: [
                {
                  id: "o1",
                  visibility: "+",
                  name: "oeffnen",
                  parameters: "",
                  returnType: "void",
                  isAbstract: true,
                },
              ],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "cls-2-solution",
          title: "Buchshop – Beziehungen",
          diagramType: "class",
          nodes: [
            {
              id: "cls2_order",
              kind: "class",
              name: "Bestellung",
              x: 60,
              y: 60,
              width: 185,
              height: 110,
              attributes: [
                { id: "a1", visibility: "-", name: "datum", type: "Date" },
              ],
              operations: [],
            },
            {
              id: "cls2_item",
              kind: "class",
              name: "Bestellposition",
              x: 60,
              y: 235,
              width: 185,
              height: 110,
              attributes: [
                { id: "a2", visibility: "-", name: "menge", type: "int" },
              ],
              operations: [],
            },
            {
              id: "cls2_book",
              kind: "class",
              name: "Buch",
              x: 340,
              y: 60,
              width: 185,
              height: 110,
              attributes: [
                { id: "a3", visibility: "-", name: "titel", type: "String" },
              ],
              operations: [],
            },
            {
              id: "cls2_ebook",
              kind: "class",
              name: "EBook",
              x: 340,
              y: 235,
              width: 185,
              height: 110,
              attributes: [
                {
                  id: "a4",
                  visibility: "-",
                  name: "dateiGroesseMB",
                  type: "float",
                },
              ],
              operations: [],
            },
            {
              id: "cls2_ifc",
              kind: "interface",
              name: "Ausleihbar",
              stereotype: "interface",
              isAbstract: true,
              x: 590,
              y: 60,
              width: 180,
              height: 105,
              attributes: [],
              operations: [
                {
                  id: "o1",
                  visibility: "+",
                  name: "oeffnen",
                  parameters: "",
                  returnType: "void",
                  isAbstract: true,
                },
              ],
            },
          ],
          edges: [
            {
              id: "cls2_e1",
              kind: "composition",
              sourceId: "cls2_order",
              targetId: "cls2_item",
              sourceMultiplicity: "1",
              targetMultiplicity: "1..*",
            },
            {
              id: "cls2_e2",
              kind: "generalization",
              sourceId: "cls2_ebook",
              targetId: "cls2_book",
            },
            {
              id: "cls2_e3",
              kind: "realization",
              sourceId: "cls2_book",
              targetId: "cls2_ifc",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "edge",
            id: "cls2-comp",
            description:
              "Komposition (◆) von „Bestellung“ (Ganzes) zu „Bestellposition“ (Teil)",
            edgeKind: "composition",
            sourceNodeNames: ["Bestellung"],
            targetNodeNames: ["Bestellposition"],
            hintOnMissing:
              "Wähle „Komposition“ und ziehe von „Bestellung“ (dort sitzt die ausgefüllte Raute ◆) zu „Bestellposition“.",
          },
          {
            type: "edge",
            id: "cls2-gen",
            description:
              "Vererbung (──▷) von der Unterklasse „EBook“ zur Oberklasse „Buch“",
            edgeKind: "generalization",
            sourceNodeNames: ["EBook"],
            targetNodeNames: ["Buch"],
            hintOnMissing:
              "Wähle „Vererbung / Generalisierung“ und ziehe den Pfeil von „EBook“ hin zur Oberklasse „Buch“.",
          },
          {
            type: "edge",
            id: "cls2-real",
            description:
              "Schnittstellen-Realisierung (- - ▷) von „Buch“ zu „Ausleihbar“",
            edgeKind: "realization",
            sourceNodeNames: ["Buch"],
            targetNodeNames: ["Ausleihbar"],
            hintOnMissing:
              "Wähle „Schnittstellen-Realisierung“ (gestrichelt) und ziehe von „Buch“ zu „Ausleihbar“.",
          },
        ],
        celebrationMessage:
          "Meisterhaft! Komposition, Vererbung und Realisierung sitzen perfekt.",
      },
      {
        id: "cls-3-detective",
        stageId: "stage-2-class",
        stepNumber: 3,
        mode: "bug-detective",
        title: "2.3 Fehler-Detektiv: Vererbungs- und Rauten-Falle",
        subtitle: "Korrigiere zwei klassische Denkfehler im Fahrzeug-Modell",
        whyItMatters:
          "In fast jedem Team-Review tauchen verdrehte Vererbungspfeile oder verwechselte Rauten auf. Jetzt lernst du, sie sofort zu heilen.",
        explanationHtml: `
          <p>In diesem Klassendiagramm sind <strong>zwei Fehler</strong> versteckt:</p>
          <ol>
            <li>Der Vererbungspfeil (<code>──▷</code>) zeigt aktuell von <code>Fahrzeug</code> auf <code>Elektroauto</code> – damit wäre jedes Fahrzeug ein Elektroauto! Er muss von der Spezialisierung (<code>Elektroauto</code>) zur Verallgemeinerung (<code>Fahrzeug</code>) zeigen.</li>
            <li>Zwischen <code>Flotte</code> und <code>Fahrzeug</code> wurde eine <strong>Komposition (◆)</strong> verwendet. Aber ein Fahrzeug wird nicht verschrottet, nur weil eine Flotten-Liste aufgelöst wird! Ändere den Typ auf <strong>Aggregation (◇)</strong>.</li>
          </ol>
        `,
        visualCheck: {
          question:
            "Warum ist zwischen „Flotte“ und „Fahrzeug“ eine Aggregation (◇) passender als eine Komposition (◆)?",
          options: [
            "Weil ein Fahrzeug auch nach Auflösung der Flotte weiterexistiert und einer anderen Flotte zugeordnet werden kann",
            "Weil Fahrzeuge keine Attribute haben",
            "Weil Komposition nur bei Schnittstellen erlaubt ist",
          ],
          correctIndex: 0,
          explanation:
            "Richtig! Keine strikte Existenzabhängigkeit = Aggregation (leere Raute ◇).",
        },
        taskPrompt:
          "1. Klicke den Vererbungspfeil zwischen „Fahrzeug“ und „Elektroauto“ an und kehre seine Richtung um (⇄). 2. Klicke die Verbindung zwischen „Flotte“ und „Fahrzeug“ an und ändere ihren Typ rechts im Inspektor von „Komposition“ auf „Aggregation“.",
        allowedNodes: ["class"],
        allowedEdges: ["aggregation", "composition", "generalization"],
        starterDiagram: {
          id: "cls-3-starter",
          title: "Fuhrpark (Fehlerhaft)",
          diagramType: "class",
          nodes: [
            {
              id: "cls3_fleet",
              kind: "class",
              name: "Flotte",
              x: 70,
              y: 110,
              width: 175,
              height: 110,
              attributes: [
                { id: "a1", visibility: "-", name: "standort", type: "String" },
              ],
              operations: [],
            },
            {
              id: "cls3_vehicle",
              kind: "class",
              name: "Fahrzeug",
              x: 330,
              y: 110,
              width: 185,
              height: 110,
              attributes: [
                {
                  id: "a2",
                  visibility: "-",
                  name: "kennzeichen",
                  type: "String",
                },
              ],
              operations: [],
            },
            {
              id: "cls3_ev",
              kind: "class",
              name: "Elektroauto",
              x: 590,
              y: 110,
              width: 190,
              height: 110,
              attributes: [
                {
                  id: "a3",
                  visibility: "-",
                  name: "akkuKapazitaetKWh",
                  type: "int",
                },
              ],
              operations: [],
            },
          ],
          edges: [
            {
              id: "cls3_e1_bug",
              kind: "composition",
              sourceId: "cls3_fleet",
              targetId: "cls3_vehicle",
              sourceMultiplicity: "0..1",
              targetMultiplicity: "0..*",
            },
            {
              id: "cls3_e2_bug",
              kind: "generalization",
              sourceId: "cls3_vehicle",
              targetId: "cls3_ev",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "cls-3-solution",
          title: "Fuhrpark (Repariert)",
          diagramType: "class",
          nodes: [
            {
              id: "cls3_fleet",
              kind: "class",
              name: "Flotte",
              x: 70,
              y: 110,
              width: 175,
              height: 110,
              attributes: [
                { id: "a1", visibility: "-", name: "standort", type: "String" },
              ],
              operations: [],
            },
            {
              id: "cls3_vehicle",
              kind: "class",
              name: "Fahrzeug",
              x: 330,
              y: 110,
              width: 185,
              height: 110,
              attributes: [
                {
                  id: "a2",
                  visibility: "-",
                  name: "kennzeichen",
                  type: "String",
                },
              ],
              operations: [],
            },
            {
              id: "cls3_ev",
              kind: "class",
              name: "Elektroauto",
              x: 590,
              y: 110,
              width: 190,
              height: 110,
              attributes: [
                {
                  id: "a3",
                  visibility: "-",
                  name: "akkuKapazitaetKWh",
                  type: "int",
                },
              ],
              operations: [],
            },
          ],
          edges: [
            {
              id: "cls3_e1_fixed",
              kind: "aggregation",
              sourceId: "cls3_fleet",
              targetId: "cls3_vehicle",
              sourceMultiplicity: "0..1",
              targetMultiplicity: "0..*",
            },
            {
              id: "cls3_e2_fixed",
              kind: "generalization",
              sourceId: "cls3_ev",
              targetId: "cls3_vehicle",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "edge",
            id: "cls3-aggr",
            description:
              "Aggregation (leere Raute ◇) von „Flotte“ zu „Fahrzeug“",
            edgeKind: "aggregation",
            sourceNodeNames: ["Flotte"],
            targetNodeNames: ["Fahrzeug"],
            hintOnMissing:
              "Klicke die Verbindung zwischen „Flotte“ und „Fahrzeug“ an und stelle den Typ rechts auf „Aggregation (leere Raute)“.",
          },
          {
            type: "edge",
            id: "cls3-gen",
            description:
              "Vererbungspfeil zeigt von „Elektroauto“ auf „Fahrzeug“",
            edgeKind: "generalization",
            sourceNodeNames: ["Elektroauto"],
            targetNodeNames: ["Fahrzeug"],
            hintOnMissing:
              "Klicke den Vererbungspfeil zwischen „Fahrzeug“ und „Elektroauto“ an und klicke rechts auf „Richtung umkehren ⇄“.",
          },
        ],
        celebrationMessage:
          "Sauber diagnostiziert! Jetzt stimmt die Domänenlogik zu 100 %.",
      },
      {
        id: "cls-4-capstone",
        stageId: "stage-2-class",
        stepNumber: 4,
        mode: "capstone-mission",
        title: "2.4 Etappen-Finale: Das Online-Kursportal",
        subtitle:
          "Modelliere eine Domänenstruktur mit Klassen, Komposition & Vererbung",
        whyItMatters:
          "Wer Datenmodelle grafisch entwerfen kann, spart beim Programmieren und im Architektur-Gespräch Stunden an Diskussionen.",
        explanationHtml: `
          <p><strong>Deine Mission:</strong> Entwirf das Klassendiagramm für ein <strong>Online-Kursportal</strong>:</p>
          <ul>
            <li>Eine Klasse <code>Kurs</code> (mit mindestens 1 Attribut, z. B. <code>titel</code>).</li>
            <li>Eine Klasse <code>Lektion</code>, die per <strong>Komposition (◆)</strong> existenzabhängig zu <code>Kurs</code> gehört (Raute an <code>Kurs</code>!).</li>
            <li>Eine Klasse <code>VideoLektion</code>, die per <strong>Vererbung (──▷)</strong> eine Spezialisierung von <code>Lektion</code> ist.</li>
            <li>Eine Klasse <code>Teilnehmer</code>, die per <strong>Assoziation</strong> (oder gerichteter Assoziation) mit <code>Kurs</code> verbunden ist (mit Multiplizität wie <code>0..*</code>).</li>
          </ul>
        `,
        visualCheck: {
          question:
            "Wenn ein Teilnehmer mehrere Kurse belegen kann und ein Kurs mehrere Teilnehmer hat, welche Multiplizitäten stehen an der Assoziation?",
          options: [
            "0..* an beiden Enden (Viele-zu-Viele / n:m)",
            "1..1 an beiden Enden",
            "Gar keine, da Assoziationen nur für Einzelobjekte gelten",
          ],
          correctIndex: 0,
          explanation:
            "Genau! `0..*` (oder `*`) an beiden Seiten drückt eine klassische n:m-Beziehung aus.",
        },
        taskPrompt:
          "Modelliere das Online-Kursportal mit den Klassen „Kurs“, „Lektion“, „VideoLektion“ und „Teilnehmer“ sowie ihren Beziehungen.",
        allowedNodes: ["class", "abstract-class", "interface", "enum", "note"],
        allowedEdges: [
          "association",
          "directed-association",
          "aggregation",
          "composition",
          "generalization",
          "realization",
          "note-link",
        ],
        starterDiagram: {
          id: "cls-4-starter",
          title: "Online-Kursportal",
          diagramType: "class",
          nodes: [
            {
              id: "cls4_course",
              kind: "class",
              name: "Kurs",
              x: 290,
              y: 65,
              width: 190,
              height: 120,
              attributes: [
                { id: "a1", visibility: "-", name: "titel", type: "String" },
              ],
              operations: [
                {
                  id: "o1",
                  visibility: "+",
                  name: "veroeffentlichen",
                  parameters: "",
                  returnType: "void",
                },
              ],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "cls-4-solution",
          title: "Online-Kursportal",
          diagramType: "class",
          nodes: [
            {
              id: "cls4_student",
              kind: "class",
              name: "Teilnehmer",
              x: 45,
              y: 65,
              width: 185,
              height: 115,
              attributes: [
                { id: "a0", visibility: "-", name: "name", type: "String" },
              ],
              operations: [],
            },
            {
              id: "cls4_course",
              kind: "class",
              name: "Kurs",
              x: 310,
              y: 65,
              width: 190,
              height: 120,
              attributes: [
                { id: "a1", visibility: "-", name: "titel", type: "String" },
              ],
              operations: [
                {
                  id: "o1",
                  visibility: "+",
                  name: "veroeffentlichen",
                  parameters: "",
                  returnType: "void",
                },
              ],
            },
            {
              id: "cls4_lesson",
              kind: "class",
              name: "Lektion",
              x: 575,
              y: 65,
              width: 185,
              height: 115,
              attributes: [
                {
                  id: "a2",
                  visibility: "-",
                  name: "dauerMinuten",
                  type: "int",
                },
              ],
              operations: [],
            },
            {
              id: "cls4_video",
              kind: "class",
              name: "VideoLektion",
              x: 575,
              y: 245,
              width: 185,
              height: 115,
              attributes: [
                {
                  id: "a3",
                  visibility: "-",
                  name: "videoUrl",
                  type: "String",
                },
              ],
              operations: [],
            },
          ],
          edges: [
            {
              id: "cls4_e1",
              kind: "association",
              sourceId: "cls4_student",
              targetId: "cls4_course",
              sourceMultiplicity: "0..*",
              targetMultiplicity: "0..*",
            },
            {
              id: "cls4_e2",
              kind: "composition",
              sourceId: "cls4_course",
              targetId: "cls4_lesson",
              sourceMultiplicity: "1",
              targetMultiplicity: "1..*",
            },
            {
              id: "cls4_e3",
              kind: "generalization",
              sourceId: "cls4_video",
              targetId: "cls4_lesson",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "node",
            id: "cls4-nodes",
            description:
              "Klassen „Kurs“, „Lektion“, „VideoLektion“ und „Teilnehmer“ existieren",
            nodeKind: ["class", "abstract-class"],
            minCount: 4,
            hintOnMissing:
              "Stelle sicher, dass alle 4 Klassen („Kurs“, „Lektion“, „VideoLektion“, „Teilnehmer“) angelegt sind.",
          },
          {
            type: "edge",
            id: "cls4-comp",
            description: "Komposition (◆) von „Kurs“ zu „Lektion“",
            edgeKind: "composition",
            sourceNodeNames: ["Kurs"],
            targetNodeNames: ["Lektion"],
            hintOnMissing:
              "Verbinde „Kurs“ (Ganzes) per Komposition (◆) mit „Lektion“ (Teil).",
          },
          {
            type: "edge",
            id: "cls4-gen",
            description: "Vererbung (──▷) von „VideoLektion“ zu „Lektion“",
            edgeKind: "generalization",
            sourceNodeNames: ["VideoLektion", "Video"],
            targetNodeNames: ["Lektion"],
            hintOnMissing:
              "Ziehe einen Vererbungspfeil von „VideoLektion“ zur Oberklasse „Lektion“.",
          },
          {
            type: "edge",
            id: "cls4-assoc",
            description: "Assoziation zwischen „Teilnehmer“ und „Kurs“",
            edgeKind: ["association", "directed-association"],
            sourceNodeNames: ["Teilnehmer", "Student", "Lernender"],
            targetNodeNames: ["Kurs"],
            allowReverseForUndirected: true,
            hintOnMissing:
              "Verbinde „Teilnehmer“ und „Kurs“ mit einer Assoziation.",
          },
        ],
        celebrationMessage:
          "Fantastisch! Du hast Etappe 2 abgeschlossen und das Abzeichen „Domänen-Architekt“ freigeschaltet!",
      },
    ],
  },

  // =========================================================================
  // ETAPPE 3: AKTIVITÄTSDIAGRAMM (ACTIVITY DIAGRAM)
  // =========================================================================
  {
    id: "stage-3-activity",
    stageNumber: 3,
    diagramType: "activity",
    title: "Etappe 3: Prozesse & Entscheidungen durchdenken",
    subtitle: "Das Aktivitätsdiagramm (Activity Diagram)",
    icon: "⚡",
    colorAccent: "#059669",
    badgeTitle: "Fluss-Meister",
    badgeIcon: "🌊",
    expressionSkillSummary:
      "Du kannst komplexe Geschäftsprozesse, Wenn-Dann-Verzweigungen und parallele Arbeitsschritte lückenlos visualisieren.",
    celebrationHeadline:
      "Etappe 3 gemeistert: Kein Ablauf bleibt dir mehr verborgen!",
    celebrationBody:
      "Mit Startknoten, Aktionen, Entscheidungsrauten samt [Guards] und Synchronisationsbalken (Fork/Join) bringst du Ordnung in jeden noch so verzweigten Workflow!",
    unlockedElementsSummary: [
      "Startknoten (●) & Aktivitätsende (◉ Bullauge)",
      "Aktion (abgerundetes Rechteck) & Objektknoten (kantiges Rechteck)",
      "Entscheidungs-/Zusammenführungsraute (◇) mit Wächterbedingungen [Guard]",
      "Parallelisierung & Synchronisation (Fork/Join-Balken ▬)",
    ],
    lessons: [
      {
        id: "act-1-boxes",
        stageId: "stage-3-activity",
        stepNumber: 1,
        mode: "guided-build",
        title: "3.1 Start, Aktion & Ende eines Ablaufs",
        subtitle: "Vom Startpunkt (●) über Aktionen zum Bullauge (◉)",
        whyItMatters:
          "Jeder Prozess braucht einen klaren Anfang, aktive Handlungsschritte und ein definiertes Ende.",
        explanationHtml: `
          <p>Ein <strong>Aktivitätsdiagramm</strong> beschreibt das „Wie“ eines Prozesses:</p>
          <ul>
            <li><strong>Startknoten (● ausgefüllter Kreis):</strong> Hier entsteht das Kontroll-Token, wenn der Prozess startet.</li>
            <li><strong>Aktion (abgerundetes Rechteck):</strong> Ein einzelner Arbeitsschritt, benannt mit Verb (z. B. <code>Bestellung prüfen</code>).</li>
            <li><strong>Aktivitätsende (◉ Bullauge):</strong> Ein gefüllter Kreis im Ring – beendet die Aktivität.</li>
          </ul>
        `,
        visualCheck: {
          question:
            "Wie unterscheidet sich das Symbol für den Startknoten vom Aktivitätsendknoten?",
          options: [
            "Der Startknoten ist ein ausgefüllter Punkt (●), das Aktivitätsende hat zusätzlich einen äußeren Ring (◉ Bullauge)",
            "Beide sind identisch",
            "Der Startknoten ist ein Dreieck",
          ],
          correctIndex: 0,
          explanation:
            "Genau! ● startet den Fluss, ◉ (Bullauge) beendet die gesamte Aktivität.",
        },
        taskPrompt:
          "Baue deinen ersten Kontrollfluss: Verbinde den Startknoten (●) → Aktion „Kaffee mahlen“ → Aktion „Espresso brühen“ → Aktivitätsende (◉) mit Kontrollfluss-Pfeilen.",
        allowedNodes: ["initial-node", "action", "activity-final"],
        allowedEdges: ["control-flow"],
        starterDiagram: {
          id: "act-1-starter",
          title: "Kaffeezubereitung",
          diagramType: "activity",
          nodes: [
            {
              id: "act1_start",
              kind: "initial-node",
              name: "Start",
              x: 90,
              y: 150,
              width: 36,
              height: 36,
              attributes: [],
              operations: [],
            },
            {
              id: "act1_grind",
              kind: "action",
              name: "Kaffee mahlen",
              x: 200,
              y: 136,
              width: 165,
              height: 64,
              attributes: [],
              operations: [],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "act-1-solution",
          title: "Kaffeezubereitung",
          diagramType: "activity",
          nodes: [
            {
              id: "act1_start",
              kind: "initial-node",
              name: "Start",
              x: 70,
              y: 150,
              width: 36,
              height: 36,
              attributes: [],
              operations: [],
            },
            {
              id: "act1_grind",
              kind: "action",
              name: "Kaffee mahlen",
              x: 175,
              y: 136,
              width: 165,
              height: 64,
              attributes: [],
              operations: [],
            },
            {
              id: "act1_brew",
              kind: "action",
              name: "Espresso brühen",
              x: 410,
              y: 136,
              width: 165,
              height: 64,
              attributes: [],
              operations: [],
            },
            {
              id: "act1_end",
              kind: "activity-final",
              name: "Ende",
              x: 645,
              y: 148,
              width: 40,
              height: 40,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "act1_e1",
              kind: "control-flow",
              sourceId: "act1_start",
              targetId: "act1_grind",
            },
            {
              id: "act1_e2",
              kind: "control-flow",
              sourceId: "act1_grind",
              targetId: "act1_brew",
            },
            {
              id: "act1_e3",
              kind: "control-flow",
              sourceId: "act1_brew",
              targetId: "act1_end",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "node",
            id: "act1-nodes",
            description:
              "Mindestens 2 Aktionen und ein Aktivitätsendknoten (◉)",
            nodeKind: "activity-final",
            hintOnMissing:
              "Füge eine zweite Aktion (z. B. „Espresso brühen“) sowie einen Aktivitätsendknoten (◉) hinzu.",
          },
          {
            type: "edge",
            id: "act1-e1",
            description: "Kontrollfluss vom Startknoten zur ersten Aktion",
            edgeKind: "control-flow",
            sourceNodeKind: "initial-node",
            targetNodeKind: "action",
            hintOnMissing:
              "Verbinde den Startknoten (●) per Kontrollfluss mit der ersten Aktion.",
          },
          {
            type: "edge",
            id: "act1-e2",
            description: "Kontrollfluss zwischen den beiden Aktionen",
            edgeKind: "control-flow",
            sourceNodeKind: "action",
            targetNodeKind: "action",
            hintOnMissing:
              "Verbinde die erste Aktion per Kontrollfluss mit der zweiten Aktion.",
          },
          {
            type: "edge",
            id: "act1-e3",
            description: "Kontrollfluss von der Aktion zum Aktivitätsende (◉)",
            edgeKind: "control-flow",
            sourceNodeKind: "action",
            targetNodeKind: "activity-final",
            hintOnMissing:
              "Verbinde die letzte Aktion per Kontrollfluss mit dem Aktivitätsende (◉).",
          },
        ],
        celebrationMessage:
          "Sehr gut! Dein erster durchgehender Kontrollfluss läuft.",
      },
      {
        id: "act-2-connections",
        stageId: "stage-3-activity",
        stepNumber: 2,
        mode: "connections",
        title:
          "3.2 Entscheidungen (◇) mit Wächterbedingungen [Guards] & Parallelisierung (▬)",
        subtitle: "Exklusive Verzweigung vs. gleichzeitige Ausführung",
        whyItMatters:
          "Der Unterschied zwischen „Entweder-Oder“ (Raute ◇) und „Gleichzeitig“ (Balken ▬) ist entscheidend für korrekte Abläufe.",
        explanationHtml: `
          <p>In Prozessen gibt es zwei völlig verschiedene Arten, wie sich ein Pfad aufteilen kann:</p>
          <ul>
            <li><strong>Entscheidung (Decision Node ◇ Raute):</strong> <em>Entweder-Oder!</em> Nur <strong>einer</strong> der ausgehenden Pfade wird genommen. Deshalb muss an jeder ausgehenden Kante eine sich ausschließende <strong>Wächterbedingung (Guard)</strong> in eckigen Klammern stehen, z. B. <code>[Lagerbestand &gt; 0]</code> und <code>[sonst]</code>.</li>
            <li><strong>Parallelisierung (Fork Node ▬ dicker Balken):</strong> <em>Sowohl-Als-Auch!</em> Alle ausgehenden Pfade starten <strong>gleichzeitig</strong> (nebenläufig), z. B. <code>Rechnung senden</code> und parallel <code>Paket packen</code>.</li>
          </ul>
        `,
        visualCheck: {
          question:
            "Nach dem Bezahlvorgang sollen GLEICHZEITIG die Rechnung per E-Mail verschickt UND das Paket im Lager gepackt werden. Welches Symbol nutzt du?",
          options: [
            "Einen Parallelisierungsbalken (Fork ▬)",
            "Eine Entscheidungsraute (Decision ◇)",
            "Zwei Startknoten",
          ],
          correctIndex: 0,
          explanation:
            "Richtig! Für gleichzeitige (parallele) Pfade nutzt man in UML den Synchronisationsbalken (Fork/Join ▬), nicht die Raute!",
        },
        taskPrompt:
          "Ziehe von der Entscheidungsraute (◇) zwei Kontrollflüsse: einen zu „Expressversand starten“ (mit Bedingung z. B. „[Express]“) und einen zu „Standardversand starten“ (mit Bedingung z. B. „[Standard]“).",
        allowedNodes: [
          "initial-node",
          "action",
          "decision-merge",
          "fork-join",
          "activity-final",
        ],
        allowedEdges: ["control-flow"],
        starterDiagram: {
          id: "act-2-starter",
          title: "Versandwahl mit Entscheidung",
          diagramType: "activity",
          nodes: [
            {
              id: "act2_order",
              kind: "action",
              name: "Bestellung prüfen",
              x: 60,
              y: 145,
              width: 165,
              height: 64,
              attributes: [],
              operations: [],
            },
            {
              id: "act2_dec",
              kind: "decision-merge",
              name: "Versandart?",
              x: 295,
              y: 143,
              width: 68,
              height: 68,
              attributes: [],
              operations: [],
            },
            {
              id: "act2_express",
              kind: "action",
              name: "Expressversand starten",
              x: 455,
              y: 65,
              width: 185,
              height: 64,
              attributes: [],
              operations: [],
            },
            {
              id: "act2_standard",
              kind: "action",
              name: "Standardversand starten",
              x: 455,
              y: 220,
              width: 185,
              height: 64,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "act2_e0",
              kind: "control-flow",
              sourceId: "act2_order",
              targetId: "act2_dec",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "act-2-solution",
          title: "Versandwahl mit Entscheidung",
          diagramType: "activity",
          nodes: [
            {
              id: "act2_order",
              kind: "action",
              name: "Bestellung prüfen",
              x: 60,
              y: 145,
              width: 165,
              height: 64,
              attributes: [],
              operations: [],
            },
            {
              id: "act2_dec",
              kind: "decision-merge",
              name: "Versandart?",
              x: 295,
              y: 143,
              width: 68,
              height: 68,
              attributes: [],
              operations: [],
            },
            {
              id: "act2_express",
              kind: "action",
              name: "Expressversand starten",
              x: 455,
              y: 65,
              width: 185,
              height: 64,
              attributes: [],
              operations: [],
            },
            {
              id: "act2_standard",
              kind: "action",
              name: "Standardversand starten",
              x: 455,
              y: 220,
              width: 185,
              height: 64,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "act2_e0",
              kind: "control-flow",
              sourceId: "act2_order",
              targetId: "act2_dec",
            },
            {
              id: "act2_e1",
              kind: "control-flow",
              sourceId: "act2_dec",
              targetId: "act2_express",
              guard: "Express gewählt",
            },
            {
              id: "act2_e2",
              kind: "control-flow",
              sourceId: "act2_dec",
              targetId: "act2_standard",
              guard: "Standard",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "edge",
            id: "act2-exp",
            description:
              "Kontrollfluss von der Raute zu „Expressversand starten“ mit Bedingung",
            edgeKind: "control-flow",
            sourceNodeKind: "decision-merge",
            targetNodeNames: ["Expressversand starten"],
            requireLabelOrGuard: true,
            hintOnMissing:
              "Verbinde die Raute mit „Expressversand starten“ und trage rechts im Inspektor eine Wächterbedingung (Guard, z. B. „Express“) ein.",
          },
          {
            type: "edge",
            id: "act2-std",
            description:
              "Kontrollfluss von der Raute zu „Standardversand starten“ mit Bedingung",
            edgeKind: "control-flow",
            sourceNodeKind: "decision-merge",
            targetNodeNames: ["Standardversand starten"],
            requireLabelOrGuard: true,
            hintOnMissing:
              "Verbinde die Raute mit „Standardversand starten“ und trage rechts im Inspektor eine Wächterbedingung (z. B. „Standard“) ein.",
          },
        ],
        celebrationMessage:
          "Klasse! Deine Entscheidungsraute hat jetzt eindeutige Wächterbedingungen.",
      },
      {
        id: "act-3-detective",
        stageId: "stage-3-activity",
        stepNumber: 3,
        mode: "bug-detective",
        title: "3.3 Fehler-Detektiv: Blinde Entscheidung ohne Bedingungen",
        subtitle: "Warum man an einer Entscheidungsraute nie raten darf",
        whyItMatters:
          "Eine Entscheidungsraute ohne Bedingungen an den ausgehenden Pfeilen ist wie ein Wegweiser ohne Beschriftung.",
        explanationHtml: `
          <p>In diesem Kreditprüfungs-Ablauf gibt es ein Problem:</p>
          <ul>
            <li>Nach der Entscheidungsraute <code>Bonität OK?</code> gehen zwar zwei Pfeile zu <code>Kredit genehmigen</code> und <code>Antrag ablehnen</code> ab – aber <strong>keiner der beiden Pfeile hat eine Wächterbedingung (Guard)</strong>!</li>
          </ul>
          <p>Klicke beide ausgehenden Pfeile der Raute nacheinander an und ergänze rechts im Inspektor ihre Wächterbedingung (z. B. <code>ja</code> / <code>Score &gt;= 700</code> bzw. <code>nein</code> / <code>sonst</code>).</p>
        `,
        visualCheck: {
          question:
            "Was schreibt UML 2.5.1 für die ausgehenden Kanten eines Entscheidungsknotens (◇) vor?",
          options: [
            "Jede ausgehende Kante braucht eine Wächterbedingung [Guard], damit klar ist, wann welcher Pfad gewählt wird",
            "Die Kanten müssen gestrichelt sein",
            "Es darf immer nur eine einzige Kante aus einer Entscheidungsraute herausführen",
          ],
          correctIndex: 0,
          explanation:
            "Exakt! Ohne Wächterbedingungen `[...]` wäre der Ablauf an der Verzweigung unbestimmt.",
        },
        taskPrompt:
          "Klicke beide Pfeile an, die aus der Raute „Bonität OK?“ herausführen, und gib jedem im Inspektor rechts eine Wächterbedingung (Guard) oder Beschriftung.",
        allowedNodes: [
          "initial-node",
          "action",
          "decision-merge",
          "activity-final",
        ],
        allowedEdges: ["control-flow"],
        starterDiagram: {
          id: "act-3-starter",
          title: "Kreditprüfung (Unvollständig)",
          diagramType: "activity",
          nodes: [
            {
              id: "act3_check",
              kind: "action",
              name: "Bonität prüfen",
              x: 65,
              y: 145,
              width: 160,
              height: 64,
              attributes: [],
              operations: [],
            },
            {
              id: "act3_dec",
              kind: "decision-merge",
              name: "Bonität OK?",
              x: 295,
              y: 143,
              width: 68,
              height: 68,
              attributes: [],
              operations: [],
            },
            {
              id: "act3_approve",
              kind: "action",
              name: "Kredit genehmigen",
              x: 455,
              y: 65,
              width: 175,
              height: 64,
              attributes: [],
              operations: [],
            },
            {
              id: "act3_reject",
              kind: "action",
              name: "Antrag ablehnen",
              x: 455,
              y: 220,
              width: 175,
              height: 64,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "act3_e0",
              kind: "control-flow",
              sourceId: "act3_check",
              targetId: "act3_dec",
            },
            {
              id: "act3_e1_bug",
              kind: "control-flow",
              sourceId: "act3_dec",
              targetId: "act3_approve",
            },
            {
              id: "act3_e2_bug",
              kind: "control-flow",
              sourceId: "act3_dec",
              targetId: "act3_reject",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "act-3-solution",
          title: "Kreditprüfung (Repariert)",
          diagramType: "activity",
          nodes: [
            {
              id: "act3_check",
              kind: "action",
              name: "Bonität prüfen",
              x: 65,
              y: 145,
              width: 160,
              height: 64,
              attributes: [],
              operations: [],
            },
            {
              id: "act3_dec",
              kind: "decision-merge",
              name: "Bonität OK?",
              x: 295,
              y: 143,
              width: 68,
              height: 68,
              attributes: [],
              operations: [],
            },
            {
              id: "act3_approve",
              kind: "action",
              name: "Kredit genehmigen",
              x: 455,
              y: 65,
              width: 175,
              height: 64,
              attributes: [],
              operations: [],
            },
            {
              id: "act3_reject",
              kind: "action",
              name: "Antrag ablehnen",
              x: 455,
              y: 220,
              width: 175,
              height: 64,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "act3_e0",
              kind: "control-flow",
              sourceId: "act3_check",
              targetId: "act3_dec",
            },
            {
              id: "act3_e1_fixed",
              kind: "control-flow",
              sourceId: "act3_dec",
              targetId: "act3_approve",
              guard: "Bonität ausreichend",
            },
            {
              id: "act3_e2_fixed",
              kind: "control-flow",
              sourceId: "act3_dec",
              targetId: "act3_reject",
              guard: "sonst",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "structural",
            id: "act3-guards",
            description:
              "Alle ausgehenden Pfade der Entscheidungsraute besitzen eine Wächterbedingung [Guard]",
            rule: "decision-outgoing-guards",
            hintOnViolation:
              "Klicke die beiden Pfeile rechts von der Raute an und trage im Feld „Wächterbedingung [Guard]“ jeweils eine Bedingung ein (z. B. „ja“ und „nein“).",
          },
        ],
        celebrationMessage:
          "Perfekt! Jetzt weiß jeder Leser sofort, wann welcher Zweig durchlaufen wird.",
      },
      {
        id: "act-4-capstone",
        stageId: "stage-3-activity",
        stepNumber: 4,
        mode: "capstone-mission",
        title: "3.4 Etappen-Finale: Parallele Bestellabwicklung",
        subtitle:
          "Modelliere einen Workflow mit Start, Parallelisierung (Fork) und Ende",
        whyItMatters:
          "Mit parallelen Pfaden zeigst du auf einen Blick, wo Prozesse beschleunigt werden können.",
        explanationHtml: `
          <p><strong>Deine Mission:</strong> Modelliere den Prozess einer <strong>Bestellabwicklung</strong>:</p>
          <ul>
            <li>Ein <strong>Startknoten (●)</strong> führt zur Aktion <code>Bestellung empfangen</code>.</li>
            <li>Danach teilt ein <strong>Parallelisierungsbalken (Fork ▬)</strong> den Ablauf in mindestens <strong>zwei gleichzeitige Aktionen</strong> auf: z. B. <code>Ware verpacken</code> und <code>Rechnung erstellen</code>.</li>
            <li>Am Ende mündet der Prozess in ein <strong>Aktivitätsende (◉)</strong>.</li>
          </ul>
        `,
        visualCheck: {
          question:
            "Was passiert an einem zusammenführenden Synchronisationsbalken (Join ▬), wenn zwei parallele Pfade dort eintreffen?",
          options: [
            "Er wartet, bis BEIDE parallelen Pfade abgeschlossen sind, und leitet erst dann weiter",
            "Er bricht den langsameren Pfad ab",
            "Er wiederholt den Prozess von vorn",
          ],
          correctIndex: 0,
          explanation:
            "Richtig! Ein Join-Balken synchronisiert die Nebenläufigkeit: Erst wenn alle eingehenden Tokens da sind, geht es weiter.",
        },
        taskPrompt:
          "Modelliere den Prozess mit Startknoten (●), „Bestellung empfangen“, einem Fork-Balken (▬) mit mindestens 2 ausgehenden parallelen Aktionen und einem Aktivitätsende (◉).",
        allowedNodes: [
          "initial-node",
          "action",
          "decision-merge",
          "fork-join",
          "object-node",
          "activity-final",
          "swimlane",
          "note",
        ],
        allowedEdges: ["control-flow", "note-link"],
        starterDiagram: {
          id: "act-4-starter",
          title: "Parallele Bestellabwicklung",
          diagramType: "activity",
          nodes: [
            {
              id: "act4_start",
              kind: "initial-node",
              name: "Start",
              x: 60,
              y: 162,
              width: 36,
              height: 36,
              attributes: [],
              operations: [],
            },
            {
              id: "act4_recv",
              kind: "action",
              name: "Bestellung empfangen",
              x: 150,
              y: 148,
              width: 175,
              height: 64,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "act4_e1",
              kind: "control-flow",
              sourceId: "act4_start",
              targetId: "act4_recv",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "act-4-solution",
          title: "Parallele Bestellabwicklung",
          diagramType: "activity",
          nodes: [
            {
              id: "act4_start",
              kind: "initial-node",
              name: "Start",
              x: 45,
              y: 162,
              width: 36,
              height: 36,
              attributes: [],
              operations: [],
            },
            {
              id: "act4_recv",
              kind: "action",
              name: "Bestellung empfangen",
              x: 130,
              y: 148,
              width: 175,
              height: 64,
              attributes: [],
              operations: [],
            },
            {
              id: "act4_fork",
              kind: "fork-join",
              name: "Fork",
              x: 340,
              y: 172,
              width: 90,
              height: 16,
              attributes: [],
              operations: [],
            },
            {
              id: "act4_pack",
              kind: "action",
              name: "Ware verpacken",
              x: 465,
              y: 80,
              width: 165,
              height: 64,
              attributes: [],
              operations: [],
            },
            {
              id: "act4_inv",
              kind: "action",
              name: "Rechnung erstellen",
              x: 465,
              y: 215,
              width: 165,
              height: 64,
              attributes: [],
              operations: [],
            },
            {
              id: "act4_end",
              kind: "activity-final",
              name: "Ende",
              x: 685,
              y: 160,
              width: 40,
              height: 40,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "act4_e1",
              kind: "control-flow",
              sourceId: "act4_start",
              targetId: "act4_recv",
            },
            {
              id: "act4_e2",
              kind: "control-flow",
              sourceId: "act4_recv",
              targetId: "act4_fork",
            },
            {
              id: "act4_e3",
              kind: "control-flow",
              sourceId: "act4_fork",
              targetId: "act4_pack",
            },
            {
              id: "act4_e4",
              kind: "control-flow",
              sourceId: "act4_fork",
              targetId: "act4_inv",
            },
            {
              id: "act4_e5",
              kind: "control-flow",
              sourceId: "act4_pack",
              targetId: "act4_end",
            },
            {
              id: "act4_e6",
              kind: "control-flow",
              sourceId: "act4_inv",
              targetId: "act4_end",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "node",
            id: "act4-actions",
            description: "Mindestens 3 Aktionen sind im Diagramm vorhanden",
            nodeKind: "action",
            minCount: 3,
            hintOnMissing:
              "Lege neben „Bestellung empfangen“ noch mindestens zwei parallele Aktionen (z. B. „Ware verpacken“ und „Rechnung erstellen“) an.",
          },
          {
            type: "structural",
            id: "act4-fork",
            description:
              "Ein Parallelisierungsbalken (Fork ▬) teilt den Fluss in mindestens 2 ausgehende Pfade",
            rule: "fork-has-multiple-outgoing",
            hintOnViolation:
              "Platziere einen „Parallelisierung (Fork / Join)“-Balken und ziehe von ihm mindestens 2 Kontrollfluss-Pfeile zu den parallelen Aktionen.",
          },
          {
            type: "node",
            id: "act4-final",
            description: "Ein Aktivitätsendknoten (◉) schließt den Ablauf ab",
            nodeKind: "activity-final",
            hintOnMissing: "Füge noch einen Aktivitätsendknoten (◉) hinzu.",
          },
        ],
        celebrationMessage:
          "Etappe 3 gemeistert! Du bist jetzt offiziell „Fluss-Meister“!",
      },
    ],
  },

  // =========================================================================
  // ETAPPE 4: ZUSTANDSDIAGRAMM (STATE MACHINE DIAGRAM)
  // =========================================================================
  {
    id: "stage-4-state",
    stageNumber: 4,
    diagramType: "state-machine",
    title: "Etappe 4: Lebenszyklen & Zustände beherrschen",
    subtitle: "Das Zustandsdiagramm (State Machine Diagram)",
    icon: "🔄",
    colorAccent: "#d97706",
    badgeTitle: "Zustands-Hüter",
    badgeIcon: "⏳",
    expressionSkillSummary:
      "Du kannst das Verhalten eines Objekts über seine gesamte Lebensdauer durch klare Zustände, Ereignisse (Trigger) und Übergänge modellieren.",
    celebrationHeadline:
      "Etappe 4 gemeistert: Du denkst in sauberen Zustandsautomaten!",
    celebrationBody:
      "Statt unübersichtlicher Flag-Variablen modellierst du jetzt klare Zustände mit entry/do/exit und präzisen Transitionen (`Ereignis [Guard] / Effekt`).",
    unlockedElementsSummary: [
      "Startzustand (●) & Endzustand (◉)",
      "Zustand mit internen Aktivitäten (`entry /`, `do /`, `exit /`)",
      "Transition mit `Ereignis [Wächterbedingung] / Aktion`",
      "Entscheidungs-Pseudozustand (◇ Choice)",
    ],
    lessons: [
      {
        id: "stm-1-boxes",
        stageId: "stage-4-state",
        stepNumber: 1,
        mode: "guided-build",
        title:
          "4.1 Was ist ein Zustand? (Und was unterscheidet ihn von einer Aktion?)",
        subtitle: "Zustände mit entry /, do / und exit /",
        whyItMatters:
          "Eine Aktion im Aktivitätsdiagramm ist ein kurzer Arbeitsschritt. Ein Zustand dagegen ist eine Lebensphase, in der ein Objekt verweilt, bis ein Ereignis eintritt!",
        explanationHtml: `
          <p>Im <strong>Zustandsdiagramm</strong> betrachten wir den Lebenszyklus <em>eines einzelnen Objekts</em> (z. B. einer Paketlieferung oder einer Ampel):</p>
          <ul>
            <li><strong>Zustand (abgerundetes Rechteck):</strong> Beschreibt eine stabile Phase wie <code>Gesperrt</code>, <code>In Prüfung</code> oder <code>Versendet</code>.</li>
            <li><strong>Interne Aktivitäten im Zustand:</strong>
              <ul>
                <li><code>entry / ...</code> wird sofort beim <em>Eintritt</em> in den Zustand ausgeführt.</li>
                <li><code>do / ...</code> läuft <em>während</em> das Objekt im Zustand verweilt.</li>
                <li><code>exit / ...</code> wird beim <em>Verlassen</em> des Zustands ausgeführt.</li>
              </ul>
            </li>
          </ul>
        `,
        visualCheck: {
          question:
            "Wann wird in einem Zustand die interne Aktivität „entry / Tür verriegeln“ ausgeführt?",
          options: [
            "Immer genau in dem Moment, in dem das Objekt in diesen Zustand eintritt",
            "Erst wenn das Objekt gelöscht wird",
            "Nur wenn ein Fehler auftritt",
          ],
          correctIndex: 0,
          explanation:
            "Richtig! `entry /` läuft beim Betreten des Zustands, `do /` währenddessen und `exit /` beim Verlassen.",
        },
        taskPrompt:
          "Platziere einen Startzustand (●) sowie die beiden Zustände „Entwurf“ und „Veröffentlicht“ (mit mindestens einer internen entry/do/exit-Aktivität).",
        allowedNodes: ["initial-state", "state", "final-state"],
        allowedEdges: [],
        starterDiagram: {
          id: "stm-1-starter",
          title: "Artikel-Lebenszyklus",
          diagramType: "state-machine",
          nodes: [
            {
              id: "stm1_init",
              kind: "initial-state",
              name: "Start",
              x: 80,
              y: 150,
              width: 36,
              height: 36,
              attributes: [],
              operations: [],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "stm-1-solution",
          title: "Artikel-Lebenszyklus",
          diagramType: "state-machine",
          nodes: [
            {
              id: "stm1_init",
              kind: "initial-state",
              name: "Start",
              x: 80,
              y: 150,
              width: 36,
              height: 36,
              attributes: [],
              operations: [],
            },
            {
              id: "stm1_draft",
              kind: "state",
              name: "Entwurf",
              x: 190,
              y: 120,
              width: 180,
              height: 96,
              attributes: [],
              operations: [],
              stateActivities: {
                entry: "speichereEntwurf()",
                doActivity: "bearbeitenErlaubt()",
              },
            },
            {
              id: "stm1_pub",
              kind: "state",
              name: "Veröffentlicht",
              x: 450,
              y: 120,
              width: 185,
              height: 96,
              attributes: [],
              operations: [],
              stateActivities: {
                entry: "sendeBenachrichtigung()",
              },
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "node",
            id: "stm1-init",
            description: "Startzustand (●) ist vorhanden",
            nodeKind: "initial-state",
            hintOnMissing: "Füge einen Startzustand (●) hinzu.",
          },
          {
            type: "node",
            id: "stm1-draft",
            description: "Zustand „Entwurf“ ist angelegt",
            nodeKind: "state",
            acceptedNames: ["Entwurf", "Neu", "Erstellt"],
            hintOnMissing: "Platziere einen Zustand und nenne ihn „Entwurf“.",
          },
          {
            type: "node",
            id: "stm1-pub",
            description:
              "Zustand „Veröffentlicht“ mit interner Aktivität (entry / do / exit)",
            nodeKind: "state",
            acceptedNames: ["Veröffentlicht", "Aktiv", "Publiziert"],
            requireStateActivity: true,
            hintOnMissing:
              "Platziere einen Zustand „Veröffentlicht“ und achte darauf, dass rechts im Inspektor z. B. `entry / ...` ausgefüllt ist.",
          },
        ],
        celebrationMessage:
          "Super! Du hast Zustände mit internem Verhalten angelegt.",
      },
      {
        id: "stm-2-connections",
        stageId: "stage-4-state",
        stepNumber: 2,
        mode: "connections",
        title: "4.2 Zustandsübergänge (Transitionen): Trigger [Guard] / Effekt",
        subtitle:
          "Welche Ereignisse bringen ein System in den nächsten Zustand?",
        whyItMatters:
          "Ein Objekt wechselt seinen Zustand nicht zufällig, sondern durch ein definiertes Ereignis (Trigger) unter einer klaren Bedingung.",
        explanationHtml: `
          <p>Ein Pfeil im Zustandsdiagramm heißt <strong>Transition (Zustandsübergang)</strong>. Seine Beschriftung folgt in UML 2.5.1 der Formel:</p>
          <p><code>Ereignis [Wächterbedingung] / Aktion</code></p>
          <ul>
            <li><strong>Ereignis (Trigger):</strong> Was passiert von außen? (z. B. <code>freigeben()</code> oder <code>münzeEinwerfen</code>).</li>
            <li><strong><code>[Wächterbedingung]</code> (Guard, optional):</strong> Nur wenn wahr, findet der Übergang statt (z. B. <code>[Text geprüft]</code>).</li>
            <li><strong><code>/ Aktion</code> (Effekt, optional):</strong> Was wird beim Übergang kurz ausgeführt? (z. B. <code>/ Zeitstempel setzen</code>).</li>
          </ul>
        `,
        visualCheck: {
          question:
            "Was bedeutet die Transitions-Beschriftung „bezahlen [Betrag >= Preis] / Ticket drucken“?",
          options: [
            "Wenn das Ereignis „bezahlen“ eintritt UND der Betrag ausreicht, wechselt der Zustand und es wird „Ticket drucken“ ausgeführt",
            "Der Zustand heißt „bezahlen“",
            "Das Ticket wird gedruckt, bevor jemand bezahlt",
          ],
          correctIndex: 0,
          explanation:
            "Genau! `Trigger [Guard] / Effekt` ist eine der ausdrucksstärksten Kurzschreibweisen der gesamten UML.",
        },
        taskPrompt:
          "1. Verbinde Startzustand (●) → „Entwurf“. 2. Ziehe eine Transition von „Entwurf“ → „Veröffentlicht“ mit einer Beschriftung (z. B. „freigeben [geprüft] / publizieren()“). 3. Verbinde „Veröffentlicht“ → Endzustand (◉).",
        allowedNodes: ["initial-state", "state", "final-state"],
        allowedEdges: ["transition"],
        starterDiagram: {
          id: "stm-2-starter",
          title: "Artikel-Transitionen",
          diagramType: "state-machine",
          nodes: [
            {
              id: "stm2_init",
              kind: "initial-state",
              name: "Start",
              x: 55,
              y: 150,
              width: 36,
              height: 36,
              attributes: [],
              operations: [],
            },
            {
              id: "stm2_draft",
              kind: "state",
              name: "Entwurf",
              x: 155,
              y: 120,
              width: 175,
              height: 96,
              attributes: [],
              operations: [],
              stateActivities: { entry: "erzeugeId()" },
            },
            {
              id: "stm2_pub",
              kind: "state",
              name: "Veröffentlicht",
              x: 420,
              y: 120,
              width: 180,
              height: 96,
              attributes: [],
              operations: [],
              stateActivities: { entry: "indexiereSuche()" },
            },
            {
              id: "stm2_final",
              kind: "final-state",
              name: "Archiviert",
              x: 675,
              y: 148,
              width: 40,
              height: 40,
              attributes: [],
              operations: [],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "stm-2-solution",
          title: "Artikel-Transitionen",
          diagramType: "state-machine",
          nodes: [
            {
              id: "stm2_init",
              kind: "initial-state",
              name: "Start",
              x: 55,
              y: 150,
              width: 36,
              height: 36,
              attributes: [],
              operations: [],
            },
            {
              id: "stm2_draft",
              kind: "state",
              name: "Entwurf",
              x: 155,
              y: 120,
              width: 175,
              height: 96,
              attributes: [],
              operations: [],
              stateActivities: { entry: "erzeugeId()" },
            },
            {
              id: "stm2_pub",
              kind: "state",
              name: "Veröffentlicht",
              x: 420,
              y: 120,
              width: 180,
              height: 96,
              attributes: [],
              operations: [],
              stateActivities: { entry: "indexiereSuche()" },
            },
            {
              id: "stm2_final",
              kind: "final-state",
              name: "Archiviert",
              x: 675,
              y: 148,
              width: 40,
              height: 40,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "stm2_e1",
              kind: "transition",
              sourceId: "stm2_init",
              targetId: "stm2_draft",
            },
            {
              id: "stm2_e2",
              kind: "transition",
              sourceId: "stm2_draft",
              targetId: "stm2_pub",
              label: "freigeben [geprüft] / publizieren()",
            },
            {
              id: "stm2_e3",
              kind: "transition",
              sourceId: "stm2_pub",
              targetId: "stm2_final",
              label: "archivieren",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "edge",
            id: "stm2-init",
            description: "Transition vom Startzustand (●) zu „Entwurf“",
            edgeKind: "transition",
            sourceNodeKind: "initial-state",
            targetNodeNames: ["Entwurf"],
            hintOnMissing:
              "Ziehe eine Transition vom Startzustand (●) zu „Entwurf“.",
          },
          {
            type: "edge",
            id: "stm2-pub",
            description:
              "Beschriftete Transition von „Entwurf“ zu „Veröffentlicht“",
            edgeKind: "transition",
            sourceNodeNames: ["Entwurf"],
            targetNodeNames: ["Veröffentlicht"],
            requireLabelOrGuard: true,
            hintOnMissing:
              "Ziehe eine Transition von „Entwurf“ zu „Veröffentlicht“ und gib ihr eine Beschriftung (z. B. „freigeben“).",
          },
          {
            type: "edge",
            id: "stm2-end",
            description: "Transition von „Veröffentlicht“ zum Endzustand (◉)",
            edgeKind: "transition",
            sourceNodeNames: ["Veröffentlicht"],
            targetNodeKind: "final-state",
            hintOnMissing:
              "Verbinde „Veröffentlicht“ per Transition mit dem Endzustand (◉).",
          },
        ],
        celebrationMessage:
          "Wunderbar! Der komplette Lebenszyklus ist sauber verbunden.",
      },
      {
        id: "stm-3-detective",
        stageId: "stage-4-state",
        stepNumber: 3,
        mode: "bug-detective",
        title: "4.3 Fehler-Detektiv: Die Sackgassen-Bestellung",
        subtitle: "Finde den falschen Übergang im Bestellstatus-Automaten",
        whyItMatters:
          "Zustandsdiagramme decken unlogische Statusübergänge (z. B. eine bereits stornierte Bestellung wird plötzlich ausgeliefert) sofort auf!",
        explanationHtml: `
          <p>Schau dir das Zustandsdiagramm einer <strong>Bestellung</strong> an:</p>
          <ul>
            <li>Aktuell führt der Übergang <code>versenden</code> vom Zustand <code>Storniert</code> zum Zustand <code>Geliefert</code>! Das ist ein schwerer Logikfehler: Eine stornierte Bestellung darf niemals versendet werden.</li>
            <li>Stattdessen muss der Übergang von <code>Bezahlt</code> zu <code>Geliefert</code> führen!</li>
          </ul>
        `,
        visualCheck: {
          question:
            "Welchen Vorteil bietet ein Zustandsdiagramm gegenüber reinem Programmcode bei solchen Status-Regeln?",
          options: [
            "Man sieht auf einen Blick alle erlaubten UND alle verbotenen Übergänge zwischen Zuständen",
            "Es ersetzt die Datenbank komplett",
            "Es braucht keine Zustandsnamen",
          ],
          correctIndex: 0,
          explanation:
            "Genau! Fehlende oder falsch verbundene Pfeile springen im Diagramm sofort ins Auge.",
        },
        taskPrompt:
          "Lösche die fehlerhafte Transition von „Storniert“ zu „Geliefert“ (anklicken → Löschen-Button oder Entf-Taste) und ziehe stattdessen eine Transition von „Bezahlt“ zu „Geliefert“.",
        allowedNodes: ["initial-state", "state", "final-state"],
        allowedEdges: ["transition"],
        starterDiagram: {
          id: "stm-3-starter",
          title: "Bestellstatus (Fehlerhaft)",
          diagramType: "state-machine",
          nodes: [
            {
              id: "stm3_init",
              kind: "initial-state",
              name: "Start",
              x: 45,
              y: 150,
              width: 36,
              height: 36,
              attributes: [],
              operations: [],
            },
            {
              id: "stm3_open",
              kind: "state",
              name: "Offen",
              x: 135,
              y: 120,
              width: 160,
              height: 90,
              attributes: [],
              operations: [],
            },
            {
              id: "stm3_paid",
              kind: "state",
              name: "Bezahlt",
              x: 365,
              y: 50,
              width: 165,
              height: 90,
              attributes: [],
              operations: [],
            },
            {
              id: "stm3_cancel",
              kind: "state",
              name: "Storniert",
              x: 365,
              y: 210,
              width: 165,
              height: 90,
              attributes: [],
              operations: [],
            },
            {
              id: "stm3_deliv",
              kind: "state",
              name: "Geliefert",
              x: 605,
              y: 120,
              width: 165,
              height: 90,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "stm3_e1",
              kind: "transition",
              sourceId: "stm3_init",
              targetId: "stm3_open",
            },
            {
              id: "stm3_e2",
              kind: "transition",
              sourceId: "stm3_open",
              targetId: "stm3_paid",
              label: "zahlungEingegangen",
            },
            {
              id: "stm3_e3",
              kind: "transition",
              sourceId: "stm3_open",
              targetId: "stm3_cancel",
              label: "stornieren",
            },
            {
              id: "stm3_e4_bug",
              kind: "transition",
              sourceId: "stm3_cancel",
              targetId: "stm3_deliv",
              label: "versenden",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "stm-3-solution",
          title: "Bestellstatus (Repariert)",
          diagramType: "state-machine",
          nodes: [
            {
              id: "stm3_init",
              kind: "initial-state",
              name: "Start",
              x: 45,
              y: 150,
              width: 36,
              height: 36,
              attributes: [],
              operations: [],
            },
            {
              id: "stm3_open",
              kind: "state",
              name: "Offen",
              x: 135,
              y: 120,
              width: 160,
              height: 90,
              attributes: [],
              operations: [],
            },
            {
              id: "stm3_paid",
              kind: "state",
              name: "Bezahlt",
              x: 365,
              y: 50,
              width: 165,
              height: 90,
              attributes: [],
              operations: [],
            },
            {
              id: "stm3_cancel",
              kind: "state",
              name: "Storniert",
              x: 365,
              y: 210,
              width: 165,
              height: 90,
              attributes: [],
              operations: [],
            },
            {
              id: "stm3_deliv",
              kind: "state",
              name: "Geliefert",
              x: 605,
              y: 120,
              width: 165,
              height: 90,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "stm3_e1",
              kind: "transition",
              sourceId: "stm3_init",
              targetId: "stm3_open",
            },
            {
              id: "stm3_e2",
              kind: "transition",
              sourceId: "stm3_open",
              targetId: "stm3_paid",
              label: "zahlungEingegangen",
            },
            {
              id: "stm3_e3",
              kind: "transition",
              sourceId: "stm3_open",
              targetId: "stm3_cancel",
              label: "stornieren",
            },
            {
              id: "stm3_e4_fixed",
              kind: "transition",
              sourceId: "stm3_paid",
              targetId: "stm3_deliv",
              label: "versenden",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "forbidden-edge",
            id: "stm3-no-cancel-deliv",
            description:
              "Fehlerhafte Transition von „Storniert“ nach „Geliefert“ wurde entfernt",
            sourceNodeNames: ["Storniert"],
            targetNodeNames: ["Geliefert"],
            hintWhenStillPresent:
              "Klicke den Pfeil zwischen „Storniert“ und „Geliefert“ an und lösche ihn (Button „Element löschen“ oder Entf-Taste).",
          },
          {
            type: "edge",
            id: "stm3-paid-deliv",
            description: "Transition führt von „Bezahlt“ nach „Geliefert“",
            edgeKind: "transition",
            sourceNodeNames: ["Bezahlt"],
            targetNodeNames: ["Geliefert"],
            hintOnMissing:
              "Ziehe eine Transition vom Zustand „Bezahlt“ zum Zustand „Geliefert“.",
          },
        ],
        celebrationMessage:
          "Fehler gebannt! Keine stornierte Bestellung verlässt mehr das Lager.",
      },
      {
        id: "stm-4-capstone",
        stageId: "stage-4-state",
        stepNumber: 4,
        mode: "capstone-mission",
        title: "4.4 Etappen-Finale: Das Paket-Schließfach (Packstation)",
        subtitle:
          "Modelliere den kompletten Zustandsautomaten eines Schließfachs",
        whyItMatters:
          "Ob Hardware-Steuerung, Buchungssystem oder UI-Komponente: Zustandsautomaten machen komplexe Reaktionen narrensicher.",
        explanationHtml: `
          <p><strong>Deine Mission:</strong> Modelliere den Lebenszyklus eines <strong>Paket-Schließfachs</strong>:</p>
          <ul>
            <li>Vom <strong>Startzustand (●)</strong> geht das Fach in den Zustand <code>Frei</code>.</li>
            <li>Wird ein Paket eingelegt, wechselt es per Transition von <code>Frei</code> nach <code>Belegt</code>.</li>
            <li>Holt der Kunde das Paket ab, wechselt es von <code>Belegt</code> nach <code>Geöffnet</code> (oder zurück nach <code>Frei</code> / zum <strong>Endzustand ◉</strong>).</li>
          </ul>
        `,
        visualCheck: {
          question:
            "Darf ein Zustandsdiagramm auch Schleifen (Übergänge zurück in einen früheren Zustand wie von „Belegt“ zurück zu „Frei“) enthalten?",
          options: [
            "Ja, absolut! Viele reale Systeme wie ein Schließfach oder eine Ampel durchlaufen Zustände immer wieder",
            "Nein, Zustände dürfen nur einmal besucht werden",
            "Nur wenn keine Ereignisse daran stehen",
          ],
          correctIndex: 0,
          explanation:
            "Richtig! Zyklische Zustandswechsel sind völlig normal bei langlebigen Systemen.",
        },
        taskPrompt:
          "Modelliere das Paket-Schließfach mit Startzustand (●), mindestens den Zuständen „Frei“ und „Belegt“ sowie den verbindenden Transitionen.",
        allowedNodes: [
          "initial-state",
          "state",
          "choice-pseudostate",
          "final-state",
          "note",
        ],
        allowedEdges: ["transition", "note-link"],
        starterDiagram: {
          id: "stm-4-starter",
          title: "Paket-Schließfach",
          diagramType: "state-machine",
          nodes: [
            {
              id: "stm4_init",
              kind: "initial-state",
              name: "Start",
              x: 60,
              y: 150,
              width: 36,
              height: 36,
              attributes: [],
              operations: [],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "stm-4-solution",
          title: "Paket-Schließfach",
          diagramType: "state-machine",
          nodes: [
            {
              id: "stm4_init",
              kind: "initial-state",
              name: "Start",
              x: 55,
              y: 150,
              width: 36,
              height: 36,
              attributes: [],
              operations: [],
            },
            {
              id: "stm4_free",
              kind: "state",
              name: "Frei",
              x: 160,
              y: 120,
              width: 175,
              height: 96,
              attributes: [],
              operations: [],
              stateActivities: { entry: "grueneLEDAn()" },
            },
            {
              id: "stm4_occ",
              kind: "state",
              name: "Belegt",
              x: 425,
              y: 120,
              width: 185,
              height: 96,
              attributes: [],
              operations: [],
              stateActivities: {
                entry: "verriegeln() & sendeAbholcode()",
              },
            },
            {
              id: "stm4_end",
              kind: "final-state",
              name: "Wartung",
              x: 685,
              y: 148,
              width: 40,
              height: 40,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "stm4_e1",
              kind: "transition",
              sourceId: "stm4_init",
              targetId: "stm4_free",
            },
            {
              id: "stm4_e2",
              kind: "transition",
              sourceId: "stm4_free",
              targetId: "stm4_occ",
              label: "paketEinlegen / tuerSchliessen()",
            },
            {
              id: "stm4_e3",
              kind: "transition",
              sourceId: "stm4_occ",
              targetId: "stm4_free",
              label: "abholcodeGueltig / entriegeln()",
            },
            {
              id: "stm4_e4",
              kind: "transition",
              sourceId: "stm4_free",
              targetId: "stm4_end",
              label: "ausserBetriebNehmen",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "node",
            id: "stm4-free",
            description: "Zustand „Frei“ ist vorhanden",
            nodeKind: "state",
            acceptedNames: ["Frei", "Leer", "Bereit"],
            hintOnMissing: "Lege einen Zustand „Frei“ an.",
          },
          {
            type: "node",
            id: "stm4-occ",
            description: "Zustand „Belegt“ ist vorhanden",
            nodeKind: "state",
            acceptedNames: ["Belegt", "Besetzt", "Reserviert"],
            hintOnMissing: "Lege einen Zustand „Belegt“ an.",
          },
          {
            type: "edge",
            id: "stm4-init-edge",
            description: "Transition vom Startzustand (●) zu „Frei“",
            edgeKind: "transition",
            sourceNodeKind: "initial-state",
            targetNodeNames: ["Frei", "Leer", "Bereit"],
            hintOnMissing:
              "Verbinde den Startzustand (●) per Transition mit „Frei“.",
          },
          {
            type: "edge",
            id: "stm4-to-occ",
            description:
              "Beschriftete Transition von „Frei“ zu „Belegt“ (z. B. „paketEinlegen“)",
            edgeKind: "transition",
            sourceNodeNames: ["Frei", "Leer", "Bereit"],
            targetNodeNames: ["Belegt", "Besetzt", "Reserviert"],
            requireLabelOrGuard: true,
            hintOnMissing:
              "Ziehe eine Transition von „Frei“ zu „Belegt“ und beschrifte sie mit dem auslösenden Ereignis.",
          },
        ],
        celebrationMessage:
          "Etappe 4 gemeistert! Du trägst nun das Abzeichen „Zustands-Hüter“!",
      },
    ],
  },

  // =========================================================================
  // ETAPPE 5: SEQUENZDIAGRAMM (SEQUENCE DIAGRAM)
  // =========================================================================
  {
    id: "stage-5-sequence",
    stageNumber: 5,
    diagramType: "sequence",
    title: "Etappe 5: Zeitliches Zusammenspiel sichtbar machen",
    subtitle: "Das Sequenzdiagramm (Sequence Diagram)",
    icon: "⏱️",
    colorAccent: "#e11d48",
    badgeTitle: "Interaktions-Dirigent",
    badgeIcon: "🎼",
    expressionSkillSummary:
      "Du kannst wie auf einer Partitur darstellen, welcher Dienst wann welche Nachricht an wen sendet und ob er synchron auf Antwort wartet oder asynchron feuert.",
    celebrationHeadline:
      "Etappe 5 gemeistert: Du dirigierst komplexe Interaktionen!",
    celebrationBody:
      "Lebenslinien, synchrone Aufrufe (──▶), asynchrone Signale (──>), gestrichelte Antworten (- - >) und kombinierte Fragmente (`alt`, `loop`, `opt`) gehören jetzt zu deinem aktiven Wortschatz!",
    unlockedElementsSummary: [
      "Lebenslinie (`:Dienst`) & Akteur-Lebenslinie mit vertikaler Zeitachse",
      "Synchrone Nachricht (──▶ ausgefülltes Dreieck) vs. Asynchrone Nachricht (──> offene Spitze)",
      "Antwortnachricht (- - > gestrichelter Pfeil zurück)",
      "Kombiniertes Fragment (`alt`, `opt`, `loop`, `par`)",
    ],
    lessons: [
      {
        id: "seq-1-boxes",
        stageId: "stage-5-sequence",
        stepNumber: 1,
        mode: "guided-build",
        title: "5.1 Die Bühne der Interaktion: Lebenslinien (Lifelines)",
        subtitle: "Horizontale Teilnehmer, vertikale Zeitachse",
        whyItMatters:
          "Wenn mehrere Systeme miteinander sprechen, verliert man im Text sofort den Überblick. Lebenslinien ordnen jeden Teilnehmer nebeneinander an – und die Zeit läuft von oben nach unten.",
        explanationHtml: `
          <p>Ein <strong>Sequenzdiagramm</strong> liest man wie ein Drehbuch in zwei Dimensionen:</p>
          <ul>
            <li><strong>Von links nach rechts:</strong> Die beteiligten Kommunikationspartner als <strong>Lebenslinien (Lifelines)</strong>, z. B. <code>Nutzer</code>, <code>:Webshop</code> und <code>:Zahlungsdienst</code>.</li>
            <li><strong>Von oben nach unten:</strong> Der zeitliche Verlauf! Je weiter unten ein Pfeil liegt, desto später passiert er.</li>
          </ul>
        `,
        visualCheck: {
          question:
            "In welche Richtung verläuft die Zeit in einem UML-Sequenzdiagramm?",
          options: [
            "Von oben nach unten entlang der gestrichelten Lebenslinien",
            "Von rechts nach links",
            "Im Uhrzeigersinn im Kreis",
          ],
          correctIndex: 0,
          explanation:
            "Genau! Oben beginnt das Szenario, und jede weiter unten eingezeichnete Nachricht findet zeitlich später statt.",
        },
        taskPrompt:
          "Stelle die Teilnehmer für einen Bezahlvorgang nebeneinander auf: Platziere eine Akteur-Lebenslinie „Kunde“ sowie zwei Lebenslinien „:Webshop“ und „:Zahlungsdienst“.",
        allowedNodes: ["actor-lifeline", "lifeline"],
        allowedEdges: [],
        starterDiagram: {
          id: "seq-1-starter",
          title: "Checkout – Lebenslinien",
          diagramType: "sequence",
          nodes: [
            {
              id: "seq1_actor",
              kind: "actor-lifeline",
              name: "Kunde",
              x: 80,
              y: 45,
              width: 120,
              height: 300,
              attributes: [],
              operations: [],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "seq-1-solution",
          title: "Checkout – Lebenslinien",
          diagramType: "sequence",
          nodes: [
            {
              id: "seq1_actor",
              kind: "actor-lifeline",
              name: "Kunde",
              x: 80,
              y: 45,
              width: 120,
              height: 300,
              attributes: [],
              operations: [],
            },
            {
              id: "seq1_shop",
              kind: "lifeline",
              name: ":Webshop",
              x: 295,
              y: 45,
              width: 140,
              height: 300,
              attributes: [],
              operations: [],
            },
            {
              id: "seq1_pay",
              kind: "lifeline",
              name: ":Zahlungsdienst",
              x: 520,
              y: 45,
              width: 150,
              height: 300,
              attributes: [],
              operations: [],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "node",
            id: "seq1-actor",
            description: "Akteur-Lebenslinie „Kunde“ ist vorhanden",
            nodeKind: "actor-lifeline",
            acceptedNames: ["Kunde", "Nutzer", "Käufer"],
            hintOnMissing: "Platziere eine Akteur-Lebenslinie „Kunde“.",
          },
          {
            type: "node",
            id: "seq1-shop",
            description: "Lebenslinie „:Webshop“ ist vorhanden",
            nodeKind: "lifeline",
            acceptedNames: ["Webshop", ":Webshop", "Shop"],
            hintOnMissing:
              "Platziere eine Lebenslinie und nenne sie „:Webshop“.",
          },
          {
            type: "node",
            id: "seq1-pay",
            description: "Lebenslinie „:Zahlungsdienst“ ist vorhanden",
            nodeKind: "lifeline",
            acceptedNames: [
              "Zahlungsdienst",
              ":Zahlungsdienst",
              "Bank",
              "Payment",
            ],
            hintOnMissing:
              "Platziere eine weitere Lebenslinie rechts daneben und nenne sie „:Zahlungsdienst“.",
          },
        ],
        celebrationMessage:
          "Die Bühne steht! Alle drei Lebenslinien sind bereit für den Nachrichtenaustausch.",
      },
      {
        id: "seq-2-connections",
        stageId: "stage-5-sequence",
        stepNumber: 2,
        mode: "connections",
        title:
          "5.2 Nachrichten-Pfeile: Synchron (──▶), Antwort (- - >) & Asynchron (──>)",
        subtitle: "Wartet der Aufrufer oder schickt er nur ein Signal?",
        whyItMatters:
          "In verteilten Systemen und APIs ist die Unterscheidung zwischen blockierendem Aufruf (synchron) und losem Event (asynchron) überlebenswichtig.",
        explanationHtml: `
          <p>In UML 2.5.1 erkennst du das Verhalten eines Aufrufs sofort an der <strong>Pfeilspitze und Linienart</strong>:</p>
          <ul>
            <li><strong>Synchrone Nachricht (<code>──▶</code> durchgezogen, AUSGEFÜLLTE Dreiecksspitze):</strong> Der Sender ruft eine Funktion auf und <em>wartet blockierend</em> auf die Antwort.</li>
            <li><strong>Antwortnachricht (<code>- - &gt;</code> gestrichelt, offene Pfeilspitze):</strong> Liefert das Ergebnis an den wartenden Aufrufer zurück.</li>
            <li><strong>Asynchrone Nachricht (<code>──&gt;</code> durchgezogen, OFFENE Pfeilspitze):</strong> Der Sender verschickt ein Signal/Event und arbeitet sofort weiter, ohne zu warten!</li>
          </ul>
        `,
        visualCheck: {
          question:
            "Woran erkennt man in UML 2.5.1 eine SYNCHRONE Nachricht (Aufrufer wartet auf Antwort)?",
          options: [
            "Durchgezogene Linie mit ausgefüllter (geschlossener) Dreiecksspitze (──▶)",
            "Gestrichelte Linie mit leerer Raute",
            "Durchgezogene Linie mit offener Pfeilspitze (──>)",
          ],
          correctIndex: 0,
          explanation:
            "Richtig! Ausgefüllte Dreiecksspitze (──▶) = Synchroner Aufruf; offene Pfeilspitze (──>) = Asynchrones Signal; gestrichelt (- - >) = Antwort.",
        },
        taskPrompt:
          "1. Sende eine synchrone Nachricht (──▶) von „:Webshop“ an „:Zahlungsdienst“. 2. Sende eine Antwortnachricht (- - >) von „:Zahlungsdienst“ zurück an „:Webshop“. 3. Sende eine asynchrone Nachricht (──>) von „:Webshop“ an „:E-Mail-Service“.",
        allowedNodes: ["actor-lifeline", "lifeline", "combined-fragment"],
        allowedEdges: ["sync-message", "return-message", "async-message"],
        starterDiagram: {
          id: "seq-2-starter",
          title: "Zahlung & Bestätigungsmail",
          diagramType: "sequence",
          nodes: [
            {
              id: "seq2_shop",
              kind: "lifeline",
              name: ":Webshop",
              x: 75,
              y: 45,
              width: 145,
              height: 310,
              attributes: [],
              operations: [],
            },
            {
              id: "seq2_pay",
              kind: "lifeline",
              name: ":Zahlungsdienst",
              x: 315,
              y: 45,
              width: 155,
              height: 310,
              attributes: [],
              operations: [],
            },
            {
              id: "seq2_mail",
              kind: "lifeline",
              name: ":E-Mail-Service",
              x: 560,
              y: 45,
              width: 155,
              height: 310,
              attributes: [],
              operations: [],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "seq-2-solution",
          title: "Zahlung & Bestätigungsmail",
          diagramType: "sequence",
          nodes: [
            {
              id: "seq2_shop",
              kind: "lifeline",
              name: ":Webshop",
              x: 75,
              y: 45,
              width: 145,
              height: 310,
              attributes: [],
              operations: [],
            },
            {
              id: "seq2_pay",
              kind: "lifeline",
              name: ":Zahlungsdienst",
              x: 315,
              y: 45,
              width: 155,
              height: 310,
              attributes: [],
              operations: [],
            },
            {
              id: "seq2_mail",
              kind: "lifeline",
              name: ":E-Mail-Service",
              x: 560,
              y: 45,
              width: 155,
              height: 310,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "seq2_e1",
              kind: "sync-message",
              sourceId: "seq2_shop",
              targetId: "seq2_pay",
              label: "bucheBetrag(49.90)",
              sequenceOrder: 1,
            },
            {
              id: "seq2_e2",
              kind: "return-message",
              sourceId: "seq2_pay",
              targetId: "seq2_shop",
              label: "transaktionOK",
              sequenceOrder: 2,
            },
            {
              id: "seq2_e3",
              kind: "async-message",
              sourceId: "seq2_shop",
              targetId: "seq2_mail",
              label: "sendeBestellbestaetigung()",
              sequenceOrder: 3,
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "edge",
            id: "seq2-sync",
            description:
              "Synchrone Nachricht (──▶) von „:Webshop“ zu „:Zahlungsdienst“",
            edgeKind: "sync-message",
            sourceNodeNames: [":Webshop", "Webshop"],
            targetNodeNames: [":Zahlungsdienst", "Zahlungsdienst"],
            hintOnMissing:
              "Wähle „Synchrone Nachricht (Aufruf)“ und ziehe von „:Webshop“ zu „:Zahlungsdienst“.",
          },
          {
            type: "edge",
            id: "seq2-ret",
            description:
              "Antwortnachricht (- - >) von „:Zahlungsdienst“ zurück zu „:Webshop“",
            edgeKind: "return-message",
            sourceNodeNames: [":Zahlungsdienst", "Zahlungsdienst"],
            targetNodeNames: [":Webshop", "Webshop"],
            hintOnMissing:
              "Wähle „Antwortnachricht (Return)“ und ziehe von „:Zahlungsdienst“ zurück zu „:Webshop“.",
          },
          {
            type: "edge",
            id: "seq2-async",
            description:
              "Asynchrone Nachricht (──>) von „:Webshop“ zu „:E-Mail-Service“",
            edgeKind: "async-message",
            sourceNodeNames: [":Webshop", "Webshop"],
            targetNodeNames: [":E-Mail-Service", "E-Mail-Service"],
            hintOnMissing:
              "Wähle „Asynchrone Nachricht (Signal)“ und ziehe von „:Webshop“ zu „:E-Mail-Service“.",
          },
        ],
        celebrationMessage:
          "Exzellent! Du unterscheidest synchron, Antwort und asynchron wie ein Profi.",
      },
      {
        id: "seq-3-detective",
        stageId: "stage-5-sequence",
        stepNumber: 3,
        mode: "bug-detective",
        title: "5.3 Fehler-Detektiv: Die falsche Antwort-Nachricht",
        subtitle: "Warum Antworten im Sequenzdiagramm keine neuen Aufrufe sind",
        whyItMatters:
          "Wenn man eine Rückgabe als synchronen Aufruf zeichnet, sieht es so aus, als würde der Server den Client neu aufrufen, statt zu antworten.",
        explanationHtml: `
          <p>In diesem Login-Sequenzdiagramm steckt ein typischer Notationsfehler:</p>
          <ul>
            <li><code>:App</code> ruft synchron <code>pruefePasswort()</code> beim <code>:AuthServer</code> auf.</li>
            <li>Die Rückgabe <code>token</code> vom <code>:AuthServer</code> an <code>:App</code> wurde aber fälschlicherweise ebenfalls als <strong>Synchrone Nachricht (durchgezogen ──▶)</strong> gezeichnet statt als <strong>Antwortnachricht (gestrichelt - - &gt;)</strong>!</li>
          </ul>
        `,
        visualCheck: {
          question:
            "Wie wird die Rückgabe (Return) eines synchronen Funktionsaufrufs im Sequenzdiagramm dargestellt?",
          options: [
            "Als gestrichelte Linie mit offener Pfeilspitze (- - >) zurück zum Aufrufer",
            "Als durchgezogene Linie mit ausgefüllter Raute",
            "Als Kompositionspfeil",
          ],
          correctIndex: 0,
          explanation:
            "Genau! Die gestrichelte Linie (- - >) macht sofort klar: Hier kehrt die Kontrolle mit dem Ergebnis zum Aufrufer zurück.",
        },
        taskPrompt:
          "Klicke die zweite Nachricht („token“) vom „:AuthServer“ zur „:App“ an und ändere ihren Verbindungstyp rechts im Inspektor auf „Antwortnachricht (Return)“.",
        allowedNodes: ["lifeline"],
        allowedEdges: ["sync-message", "return-message", "async-message"],
        starterDiagram: {
          id: "seq-3-starter",
          title: "Login-Sequenz (Fehlerhaft)",
          diagramType: "sequence",
          nodes: [
            {
              id: "seq3_app",
              kind: "lifeline",
              name: ":App",
              x: 140,
              y: 45,
              width: 145,
              height: 300,
              attributes: [],
              operations: [],
            },
            {
              id: "seq3_auth",
              kind: "lifeline",
              name: ":AuthServer",
              x: 420,
              y: 45,
              width: 155,
              height: 300,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "seq3_e1",
              kind: "sync-message",
              sourceId: "seq3_app",
              targetId: "seq3_auth",
              label: "pruefePasswort(user, pw)",
              sequenceOrder: 1,
            },
            {
              id: "seq3_e2_bug",
              kind: "sync-message",
              sourceId: "seq3_auth",
              targetId: "seq3_app",
              label: "jwtToken",
              sequenceOrder: 2,
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "seq-3-solution",
          title: "Login-Sequenz (Repariert)",
          diagramType: "sequence",
          nodes: [
            {
              id: "seq3_app",
              kind: "lifeline",
              name: ":App",
              x: 140,
              y: 45,
              width: 145,
              height: 300,
              attributes: [],
              operations: [],
            },
            {
              id: "seq3_auth",
              kind: "lifeline",
              name: ":AuthServer",
              x: 420,
              y: 45,
              width: 155,
              height: 300,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "seq3_e1",
              kind: "sync-message",
              sourceId: "seq3_app",
              targetId: "seq3_auth",
              label: "pruefePasswort(user, pw)",
              sequenceOrder: 1,
            },
            {
              id: "seq3_e2_fixed",
              kind: "return-message",
              sourceId: "seq3_auth",
              targetId: "seq3_app",
              label: "jwtToken",
              sequenceOrder: 2,
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "edge",
            id: "seq3-sync",
            description:
              "Synchroner Aufruf von „:App“ an „:AuthServer“ bleibt bestehen",
            edgeKind: "sync-message",
            sourceNodeNames: [":App", "App"],
            targetNodeNames: [":AuthServer", "AuthServer"],
            hintOnMissing:
              "Der erste Pfeil von „:App“ zu „:AuthServer“ muss eine synchrone Nachricht sein.",
          },
          {
            type: "edge",
            id: "seq3-ret",
            description:
              "Rückgabe von „:AuthServer“ an „:App“ ist eine gestrichelte Antwortnachricht (Return)",
            edgeKind: "return-message",
            sourceNodeNames: [":AuthServer", "AuthServer"],
            targetNodeNames: [":App", "App"],
            hintOnMissing:
              "Klicke den unteren Pfeil („jwtToken“) an und stelle seinen Typ rechts auf „Antwortnachricht (Return)“.",
          },
        ],
        celebrationMessage:
          "Perfekt korrigiert! Anfrage und Antwort sind jetzt sofort unterscheidbar.",
      },
      {
        id: "seq-4-capstone",
        stageId: "stage-5-sequence",
        stepNumber: 4,
        mode: "capstone-mission",
        title: "5.4 Etappen-Finale: Ticket-Reservierung mit Antwort",
        subtitle: "Modelliere ein Zusammenspiel über drei Lebenslinien",
        whyItMatters:
          "Wer einen API-Ablauf über drei Stationen als Sequenzdiagramm skizzieren kann, klärt Schnittstellenfragen in Minuten.",
        explanationHtml: `
          <p><strong>Deine Mission:</strong> Modelliere die <strong>Kino-Ticket-Reservierung</strong>:</p>
          <ul>
            <li>Ein Akteur <code>Besucher</code> (oder Lebenslinie) sendet eine Nachricht an <code>:BuchungsService</code>.</li>
            <li><code>:BuchungsService</code> ruft synchron (<code>──▶</code>) <code>reservierePlatz()</code> bei <code>:SaalplanDB</code> auf.</li>
            <li><code>:SaalplanDB</code> sendet eine <strong>Antwortnachricht (<code>- - &gt;</code>)</strong> zurück an <code>:BuchungsService</code>.</li>
          </ul>
        `,
        visualCheck: {
          question:
            "Welches Element nutzt man im Sequenzdiagramm, wenn ein Nachrichtenblock nur unter einer Bedingung (z. B. `[Platz frei]`) ausgeführt wird?",
          options: [
            "Ein Kombiniertes Fragment (Combined Fragment) mit dem Operator `opt` oder `alt`",
            "Ein Paket-Symbol",
            "Einen Akteur",
          ],
          correctIndex: 0,
          explanation:
            "Richtig! Kombinierte Fragmente (`alt`, `opt`, `loop`) rahmen bedingte oder wiederholte Nachrichten direkt auf den Lebenslinien ein.",
        },
        taskPrompt:
          "Modelliere die Sequenz zwischen „Besucher“, „:BuchungsService“ und „:SaalplanDB“ gemäß der Checkliste.",
        allowedNodes: [
          "actor-lifeline",
          "lifeline",
          "combined-fragment",
          "note",
        ],
        allowedEdges: [
          "sync-message",
          "async-message",
          "return-message",
          "note-link",
        ],
        starterDiagram: {
          id: "seq-4-starter",
          title: "Kino-Reservierung",
          diagramType: "sequence",
          nodes: [
            {
              id: "seq4_user",
              kind: "actor-lifeline",
              name: "Besucher",
              x: 65,
              y: 45,
              width: 120,
              height: 310,
              attributes: [],
              operations: [],
            },
            {
              id: "seq4_svc",
              kind: "lifeline",
              name: ":BuchungsService",
              x: 285,
              y: 45,
              width: 160,
              height: 310,
              attributes: [],
              operations: [],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "seq-4-solution",
          title: "Kino-Reservierung",
          diagramType: "sequence",
          nodes: [
            {
              id: "seq4_user",
              kind: "actor-lifeline",
              name: "Besucher",
              x: 65,
              y: 45,
              width: 120,
              height: 310,
              attributes: [],
              operations: [],
            },
            {
              id: "seq4_svc",
              kind: "lifeline",
              name: ":BuchungsService",
              x: 285,
              y: 45,
              width: 160,
              height: 310,
              attributes: [],
              operations: [],
            },
            {
              id: "seq4_db",
              kind: "lifeline",
              name: ":SaalplanDB",
              x: 535,
              y: 45,
              width: 155,
              height: 310,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "seq4_e1",
              kind: "sync-message",
              sourceId: "seq4_user",
              targetId: "seq4_svc",
              label: "bucheSitzplatz(Reihe 5, Platz 8)",
              sequenceOrder: 1,
            },
            {
              id: "seq4_e2",
              kind: "sync-message",
              sourceId: "seq4_svc",
              targetId: "seq4_db",
              label: "reservierePlatz(5, 8)",
              sequenceOrder: 2,
            },
            {
              id: "seq4_e3",
              kind: "return-message",
              sourceId: "seq4_db",
              targetId: "seq4_svc",
              label: "reservierungBestätigt",
              sequenceOrder: 3,
            },
            {
              id: "seq4_e4",
              kind: "return-message",
              sourceId: "seq4_svc",
              targetId: "seq4_user",
              label: "ticketCode",
              sequenceOrder: 4,
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "node",
            id: "seq4-db",
            description: "Lebenslinie „:SaalplanDB“ ist angelegt",
            nodeKind: "lifeline",
            acceptedNames: [
              ":SaalplanDB",
              "SaalplanDB",
              "Datenbank",
              ":Datenbank",
            ],
            hintOnMissing:
              "Füge rechts eine dritte Lebenslinie „:SaalplanDB“ hinzu.",
          },
          {
            type: "edge",
            id: "seq4-msg1",
            description: "Nachricht von „Besucher“ an „:BuchungsService“",
            edgeKind: ["sync-message", "async-message"],
            sourceNodeNames: ["Besucher", "Kunde"],
            targetNodeNames: [":BuchungsService", "BuchungsService"],
            hintOnMissing:
              "Ziehe eine Nachricht von „Besucher“ zu „:BuchungsService“.",
          },
          {
            type: "edge",
            id: "seq4-msg2",
            description:
              "Synchrone Nachricht (──▶) von „:BuchungsService“ an „:SaalplanDB“",
            edgeKind: "sync-message",
            sourceNodeNames: [":BuchungsService", "BuchungsService"],
            targetNodeNames: [":SaalplanDB", "SaalplanDB", "Datenbank"],
            hintOnMissing:
              "Ziehe eine synchrone Nachricht von „:BuchungsService“ zu „:SaalplanDB“.",
          },
          {
            type: "edge",
            id: "seq4-ret",
            description:
              "Antwortnachricht (- - >) von „:SaalplanDB“ zurück an „:BuchungsService“",
            edgeKind: "return-message",
            sourceNodeNames: [":SaalplanDB", "SaalplanDB", "Datenbank"],
            targetNodeNames: [":BuchungsService", "BuchungsService"],
            hintOnMissing:
              "Ziehe eine gestrichelte Antwortnachricht von „:SaalplanDB“ zurück zu „:BuchungsService“.",
          },
        ],
        celebrationMessage:
          "Etappe 5 gemeistert! Du hast das Abzeichen „Interaktions-Dirigent“ errungen!",
      },
    ],
  },

  // =========================================================================
  // ETAPPE 6: KOMPONENTENDIAGRAMM (COMPONENT DIAGRAM)
  // =========================================================================
  {
    id: "stage-6-component",
    stageNumber: 6,
    diagramType: "component",
    title: "Etappe 6: Große Systeme modular schneiden",
    subtitle: "Das Komponentendiagramm (Component Diagram)",
    icon: "🧩",
    colorAccent: "#0284c7",
    badgeTitle: "System-Architekt",
    badgeIcon: "🏗️",
    expressionSkillSummary:
      "Du kannst ganze Software-Landschaften in saubere, austauschbare Komponenten mit angebotenen (Lollipop) und benötigten (Socket) Schnittstellen gliedern.",
    celebrationHeadline:
      "Alle 6 Etappen vollendet: Du bist zertifizierter UML-2.5.1-System-Architekt!",
    celebrationBody:
      "Du hast den gesamten Lernpfad gemeistert! Von der ersten Idee (Use Case) über Struktur (Klassen & Komponenten) bis zum Verhalten (Aktivitäten, Zustände & Sequenzen) kannst du jedes System grafisch klar beschreiben.",
    unlockedElementsSummary: [
      "Komponente («component») mit Komponenten-Icon",
      "Angebotene Schnittstelle (Lollipop ○—) & Benötigte Schnittstelle (Socket )—)",
      "Schnittstellen-Kopplung (Assembly Connector) & Dependency (- - >)",
      "Paket («package») zur Architektur-Schichtung",
    ],
    lessons: [
      {
        id: "cmp-1-boxes",
        stageId: "stage-6-component",
        stepNumber: 1,
        mode: "guided-build",
        title:
          "6.1 Komponenten («component») & Schnittstellen (Lollipop / Socket)",
        subtitle: "Modulare Black-Box-Bausteine",
        whyItMatters:
          "Ein gutes System besteht aus austauschbaren Modulen, die ihr Inneres verbergen und nur über klar definierte Stecker (Schnittstellen) verbunden sind.",
        explanationHtml: `
          <p>Im <strong>Komponentendiagramm</strong> blickst du aus der Vogelperspektive auf die großen Bausteine deiner Architektur:</p>
          <ul>
            <li><strong>Komponente (<code>«component»</code>):</strong> Ein abgeschlossener Systembaustein (z. B. <code>BestellService</code>, <code>ZahlungsAdapter</code>), erkennbar am Stereotyp und dem kleinen Komponenten-Baustein-Symbol oben rechts.</li>
            <li><strong>Angebotene Schnittstelle (Provided Interface, Lollipop <code>○—</code>):</strong> Ein geschlossener Kreis zeigt, welchen Vertrag eine Komponente nach außen <em>bereitstellt</em>.</li>
            <li><strong>Benötigte Schnittstelle (Required Interface, Socket <code>)—</code>):</strong> Ein offener Halbkreis (Greifer) zeigt, welche Schnittstelle eine Komponente von einem Partner <em>benötigt</em>.</li>
          </ul>
        `,
        visualCheck: {
          question:
            "Was symbolisiert das „Lollipop“-Symbol (Kreis am Stiel ○—) im UML-2.5.1-Komponentendiagramm?",
          options: [
            "Eine angebotene Schnittstelle (Provided Interface), die von einer Komponente bereitgestellt wird",
            "Einen Startknoten",
            "Eine gelöschte Klasse",
          ],
          correctIndex: 0,
          explanation:
            "Genau! Der Lollipop (Kreis) ist das Angebot; der Socket (Halbkreis-Schale) ist die Nachfrage.",
        },
        taskPrompt:
          "Platziere zwei Komponenten: „BestellService“ und „ZahlungsGateway“ sowie eine angebotene Schnittstelle (Lollipop) „IZahlung“.",
        allowedNodes: [
          "component",
          "provided-interface",
          "required-interface",
          "package",
        ],
        allowedEdges: [],
        starterDiagram: {
          id: "cmp-1-starter",
          title: "Shop-Komponenten",
          diagramType: "component",
          nodes: [],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "cmp-1-solution",
          title: "Shop-Komponenten",
          diagramType: "component",
          nodes: [
            {
              id: "cmp1_order",
              kind: "component",
              name: "BestellService",
              stereotype: "component",
              x: 75,
              y: 120,
              width: 195,
              height: 96,
              attributes: [],
              operations: [],
            },
            {
              id: "cmp1_ifc",
              kind: "provided-interface",
              name: "IZahlung",
              x: 345,
              y: 141,
              width: 120,
              height: 54,
              attributes: [],
              operations: [],
            },
            {
              id: "cmp1_pay",
              kind: "component",
              name: "ZahlungsGateway",
              stereotype: "component",
              x: 525,
              y: 120,
              width: 195,
              height: 96,
              attributes: [],
              operations: [],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "node",
            id: "cmp1-order",
            description: "Komponente „BestellService“ ist vorhanden",
            nodeKind: "component",
            acceptedNames: ["BestellService", "Bestellung", "ShopService"],
            hintOnMissing:
              "Platziere eine Komponente und nenne sie „BestellService“.",
          },
          {
            type: "node",
            id: "cmp1-pay",
            description: "Komponente „ZahlungsGateway“ ist vorhanden",
            nodeKind: "component",
            acceptedNames: [
              "ZahlungsGateway",
              "PaymentGateway",
              "ZahlungsService",
            ],
            hintOnMissing:
              "Platziere eine zweite Komponente und nenne sie „ZahlungsGateway“.",
          },
          {
            type: "node",
            id: "cmp1-lollipop",
            description:
              "Angebotene Schnittstelle (Lollipop) „IZahlung“ ist vorhanden",
            nodeKind: "provided-interface",
            acceptedNames: ["IZahlung", "Zahlung", "PaymentAPI", "API"],
            hintOnMissing:
              "Platziere eine „Angebotene Schnittstelle (Lollipop)“ und nenne sie „IZahlung“.",
          },
        ],
        celebrationMessage:
          "Sehr gut! Deine Komponenten und Schnittstellen stehen bereit.",
      },
      {
        id: "cmp-2-connections",
        stageId: "stage-6-component",
        stepNumber: 2,
        mode: "connections",
        title:
          "6.2 Komponenten verdrahten: Angebot, Nachfrage & Abhängigkeiten",
        subtitle: "Wie Stecker (Lollipop) und Buchse (Socket) zusammenfinden",
        whyItMatters:
          "Wenn Komponenten nur von Schnittstellen statt von konkreten Implementierungen abhängen, kannst du jedes Modul später schmerzfrei austauschen.",
        explanationHtml: `
          <p>So drückst du die Verdrahtung zwischen Komponenten aus:</p>
          <ul>
            <li><strong>Schnittstellen-Realisierung (<code>- - ▷</code>) oder Bereitstellung:</strong> Das <code>ZahlungsGateway</code> stellt die Schnittstelle <code>IZahlung</code> bereit.</li>
            <li><strong>Abhängigkeit / Dependency (<code>- - &gt;</code>):</strong> Der <code>BestellService</code> nutzt (benötigt) die Schnittstelle <code>IZahlung</code>.</li>
            <li><strong>Schnittstellen-Kopplung (Assembly Connector):</strong> Verbindet direkt den Konsumenten mit dem Anbieter über Ball-and-Socket.</li>
          </ul>
        `,
        visualCheck: {
          question:
            "In welche Richtung zeigt der gestrichelte Abhängigkeitspfeil (Dependency `- - >`), wenn „BestellService“ die Schnittstelle „IZahlung“ benötigt?",
          options: [
            "Vom benötigenden „BestellService“ hin zur Schnittstelle „IZahlung“",
            "Von „IZahlung“ hin zu „BestellService“",
            "Abhängigkeiten haben keine Pfeilspitze",
          ],
          correctIndex: 0,
          explanation:
            "Richtig! Der Abhängigkeitspfeil zeigt immer vom Abhängigen (Nutzer) auf das, wovon er abhängt.",
        },
        taskPrompt:
          "1. Verbinde „ZahlungsGateway“ per Realisierung (- - ▷) mit „IZahlung“. 2. Verbinde „BestellService“ per Abhängigkeit (- - >) mit „IZahlung“.",
        allowedNodes: ["component", "provided-interface", "interface"],
        allowedEdges: ["realization", "dependency", "assembly-connector"],
        starterDiagram: {
          id: "cmp-2-starter",
          title: "Schnittstellen-Entkopplung",
          diagramType: "component",
          nodes: [
            {
              id: "cmp2_order",
              kind: "component",
              name: "BestellService",
              stereotype: "component",
              x: 65,
              y: 125,
              width: 195,
              height: 96,
              attributes: [],
              operations: [],
            },
            {
              id: "cmp2_ifc",
              kind: "provided-interface",
              name: "IZahlung",
              x: 345,
              y: 146,
              width: 120,
              height: 54,
              attributes: [],
              operations: [],
            },
            {
              id: "cmp2_pay",
              kind: "component",
              name: "ZahlungsGateway",
              stereotype: "component",
              x: 545,
              y: 125,
              width: 195,
              height: 96,
              attributes: [],
              operations: [],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "cmp-2-solution",
          title: "Schnittstellen-Entkopplung",
          diagramType: "component",
          nodes: [
            {
              id: "cmp2_order",
              kind: "component",
              name: "BestellService",
              stereotype: "component",
              x: 65,
              y: 125,
              width: 195,
              height: 96,
              attributes: [],
              operations: [],
            },
            {
              id: "cmp2_ifc",
              kind: "provided-interface",
              name: "IZahlung",
              x: 345,
              y: 146,
              width: 120,
              height: 54,
              attributes: [],
              operations: [],
            },
            {
              id: "cmp2_pay",
              kind: "component",
              name: "ZahlungsGateway",
              stereotype: "component",
              x: 545,
              y: 125,
              width: 195,
              height: 96,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "cmp2_e1",
              kind: "realization",
              sourceId: "cmp2_pay",
              targetId: "cmp2_ifc",
            },
            {
              id: "cmp2_e2",
              kind: "dependency",
              sourceId: "cmp2_order",
              targetId: "cmp2_ifc",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "edge",
            id: "cmp2-real",
            description:
              "Realisierung (- - ▷) von „ZahlungsGateway“ zu „IZahlung“",
            edgeKind: ["realization", "assembly-connector"],
            sourceNodeNames: ["ZahlungsGateway"],
            targetNodeNames: ["IZahlung"],
            hintOnMissing:
              "Wähle „Schnittstellen-Realisierung“ und ziehe von „ZahlungsGateway“ zu „IZahlung“.",
          },
          {
            type: "edge",
            id: "cmp2-dep",
            description:
              "Abhängigkeit (- - >) von „BestellService“ zu „IZahlung“",
            edgeKind: ["dependency", "assembly-connector"],
            sourceNodeNames: ["BestellService"],
            targetNodeNames: ["IZahlung"],
            hintOnMissing:
              "Wähle „Abhängigkeit (Dependency)“ und ziehe von „BestellService“ zu „IZahlung“.",
          },
        ],
        celebrationMessage:
          "Saubere Architektur! Beide Komponenten sind über die Schnittstelle entkoppelt.",
      },
      {
        id: "cmp-3-detective",
        stageId: "stage-6-component",
        stepNumber: 3,
        mode: "bug-detective",
        title: "6.3 Fehler-Detektiv: Verdrehte Schichten-Abhängigkeit",
        subtitle:
          "Wenn die Datenbank plötzlich von der Benutzeroberfläche abhängt",
        whyItMatters:
          "In einer sauberen Schichtenarchitektur hängt die UI von der Fachlogik ab – niemals die Datenbank von der UI!",
        explanationHtml: `
          <p>In diesem Architektur-Schaubild ist ein <strong>Abhängigkeitspfeil falsch herum</strong> gezeichnet:</p>
          <ul>
            <li><code>WebFrontend</code> hängt korrekt von <code>KernService</code> ab.</li>
            <li>Aber <code>DatenbankAdapter</code> zeigt mit einem Dependency-Pfeil auf <code>WebFrontend</code>! Lösche diesen falschen Pfeil und ziehe stattdessen eine Abhängigkeit von <code>KernService</code> zu <code>DatenbankAdapter</code>.</li>
          </ul>
        `,
        visualCheck: {
          question:
            "Warum ist eine Abhängigkeit von „DatenbankAdapter“ auf „WebFrontend“ ein Architektur-Warnzeichen?",
          options: [
            "Weil die Datenschicht dann nicht mehr ohne die konkrete Oberfläche wiederverwendet oder getestet werden kann",
            "Weil Komponenten maximal 8 Buchstaben lang sein dürfen",
            "Weil Datenbanken in UML nicht erlaubt sind",
          ],
          correctIndex: 0,
          explanation:
            "Genau! Abhängigkeiten zeigen in Richtung der genutzten Schicht oder der abstrahierten Schnittstelle.",
        },
        taskPrompt:
          "1. Lösche den fehlerhaften Abhängigkeitspfeil von „DatenbankAdapter“ zu „WebFrontend“. 2. Ziehe eine Abhängigkeit (- - >) von „KernService“ zu „DatenbankAdapter“.",
        allowedNodes: ["component", "package"],
        allowedEdges: ["dependency", "assembly-connector"],
        starterDiagram: {
          id: "cmp-3-starter",
          title: "Schichtenarchitektur (Fehlerhaft)",
          diagramType: "component",
          nodes: [
            {
              id: "cmp3_ui",
              kind: "component",
              name: "WebFrontend",
              stereotype: "component",
              x: 65,
              y: 120,
              width: 190,
              height: 96,
              attributes: [],
              operations: [],
            },
            {
              id: "cmp3_core",
              kind: "component",
              name: "KernService",
              stereotype: "component",
              x: 330,
              y: 120,
              width: 190,
              height: 96,
              attributes: [],
              operations: [],
            },
            {
              id: "cmp3_db",
              kind: "component",
              name: "DatenbankAdapter",
              stereotype: "component",
              x: 590,
              y: 120,
              width: 195,
              height: 96,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "cmp3_e1",
              kind: "dependency",
              sourceId: "cmp3_ui",
              targetId: "cmp3_core",
            },
            {
              id: "cmp3_e2_bug",
              kind: "dependency",
              sourceId: "cmp3_db",
              targetId: "cmp3_ui",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "cmp-3-solution",
          title: "Schichtenarchitektur (Repariert)",
          diagramType: "component",
          nodes: [
            {
              id: "cmp3_ui",
              kind: "component",
              name: "WebFrontend",
              stereotype: "component",
              x: 65,
              y: 120,
              width: 190,
              height: 96,
              attributes: [],
              operations: [],
            },
            {
              id: "cmp3_core",
              kind: "component",
              name: "KernService",
              stereotype: "component",
              x: 330,
              y: 120,
              width: 190,
              height: 96,
              attributes: [],
              operations: [],
            },
            {
              id: "cmp3_db",
              kind: "component",
              name: "DatenbankAdapter",
              stereotype: "component",
              x: 590,
              y: 120,
              width: 195,
              height: 96,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "cmp3_e1",
              kind: "dependency",
              sourceId: "cmp3_ui",
              targetId: "cmp3_core",
            },
            {
              id: "cmp3_e2_fixed",
              kind: "dependency",
              sourceId: "cmp3_core",
              targetId: "cmp3_db",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "forbidden-edge",
            id: "cmp3-no-db-ui",
            description:
              "Fehlerhafte Abhängigkeit von „DatenbankAdapter“ auf „WebFrontend“ wurde entfernt",
            sourceNodeNames: ["DatenbankAdapter"],
            targetNodeNames: ["WebFrontend"],
            hintWhenStillPresent:
              "Klicke den gestrichelten Pfeil von „DatenbankAdapter“ zu „WebFrontend“ an und lösche ihn.",
          },
          {
            type: "edge",
            id: "cmp3-core-db",
            description:
              "Abhängigkeit (- - >) führt von „KernService“ zu „DatenbankAdapter“",
            edgeKind: "dependency",
            sourceNodeNames: ["KernService"],
            targetNodeNames: ["DatenbankAdapter"],
            hintOnMissing:
              "Ziehe eine Abhängigkeit (- - >) von „KernService“ zu „DatenbankAdapter“.",
          },
        ],
        celebrationMessage:
          "Sauber! Die Abhängigkeitsrichtung deiner Schichtenarchitektur stimmt wieder.",
      },
      {
        id: "cmp-4-capstone",
        stageId: "stage-6-component",
        stepNumber: 4,
        mode: "capstone-mission",
        title: "6.4 Großes Finale: Musik-Streaming-Architektur",
        subtitle:
          "Entwirf die Komponenten-Landschaft einer Streaming-Plattform",
        whyItMatters:
          "Hier führst du alles zusammen: Modulare Komponenten, klare Schnittstellen und saubere Abhängigkeiten.",
        explanationHtml: `
          <p><strong>Deine Abschluss-Mission:</strong> Entwirf die Komponentenarchitektur einer <strong>Musik-Streaming-Plattform</strong>:</p>
          <ul>
            <li>Mindestens <strong>drei Komponenten (<code>«component»</code>)</strong>: z. B. <code>PlayerApp</code>, <code>StreamingService</code> und <code>KatalogService</code>.</li>
            <li>Mindestens <strong>eine Schnittstelle</strong> (Lollipop <code>○—</code> oder <code>«interface»</code>), z. B. <code>AudioStreamAPI</code>.</li>
            <li>Verbinde <code>PlayerApp</code> mit <code>StreamingService</code> sowie <code>PlayerApp</code> (oder <code>StreamingService</code>) mit <code>KatalogService</code> über Abhängigkeiten, Realisierungen oder Schnittstellen-Kopplungen.</li>
          </ul>
        `,
        visualCheck: {
          question:
            "Was hast du gewonnen, wenn du alle 6 Diagrammtypen sicher beherrschst?",
          options: [
            "Du kannst für jede Frage (Nutzen, Struktur, Prozess, Lebenszyklus, Zeitverlauf, Modul-Architektur) genau das passende visuelle Ausdrucksmittel wählen",
            "Du musst jedes Projekt immer mit allen 14 Diagrammen gleichzeitig dokumentieren",
            "Du brauchst keine Gespräche mit Menschen mehr zu führen",
          ],
          correctIndex: 0,
          explanation:
            "Genau darum geht es: Diagramme sind Werkzeuge des Denkens und der Verständigung zwischen Menschen!",
        },
        taskPrompt:
          "Modelliere die Musik-Streaming-Plattform mit mindestens 3 Komponenten, 1 Schnittstelle und den verbindenden Beziehungen.",
        allowedNodes: [
          "component",
          "provided-interface",
          "required-interface",
          "port",
          "package",
          "interface",
          "note",
        ],
        allowedEdges: [
          "assembly-connector",
          "dependency",
          "realization",
          "directed-association",
          "note-link",
        ],
        starterDiagram: {
          id: "cmp-4-starter",
          title: "Musik-Streaming-Plattform",
          diagramType: "component",
          nodes: [
            {
              id: "cmp4_app",
              kind: "component",
              name: "PlayerApp",
              stereotype: "component",
              x: 70,
              y: 120,
              width: 195,
              height: 96,
              attributes: [],
              operations: [],
            },
          ],
          edges: [],
          updatedAt: new Date().toISOString(),
        },
        sampleSolutionDiagram: {
          id: "cmp-4-solution",
          title: "Musik-Streaming-Plattform",
          diagramType: "component",
          nodes: [
            {
              id: "cmp4_app",
              kind: "component",
              name: "PlayerApp",
              stereotype: "component",
              x: 60,
              y: 120,
              width: 190,
              height: 96,
              attributes: [],
              operations: [],
            },
            {
              id: "cmp4_api",
              kind: "provided-interface",
              name: "AudioStreamAPI",
              x: 315,
              y: 75,
              width: 135,
              height: 54,
              attributes: [],
              operations: [],
            },
            {
              id: "cmp4_stream",
              kind: "component",
              name: "StreamingService",
              stereotype: "component",
              x: 510,
              y: 55,
              width: 200,
              height: 96,
              attributes: [],
              operations: [],
            },
            {
              id: "cmp4_cat",
              kind: "component",
              name: "KatalogService",
              stereotype: "component",
              x: 510,
              y: 210,
              width: 200,
              height: 96,
              attributes: [],
              operations: [],
            },
          ],
          edges: [
            {
              id: "cmp4_e1",
              kind: "dependency",
              sourceId: "cmp4_app",
              targetId: "cmp4_api",
            },
            {
              id: "cmp4_e2",
              kind: "realization",
              sourceId: "cmp4_stream",
              targetId: "cmp4_api",
            },
            {
              id: "cmp4_e3",
              kind: "dependency",
              sourceId: "cmp4_app",
              targetId: "cmp4_cat",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        criteria: [
          {
            type: "node",
            id: "cmp4-three-comps",
            description:
              "Mindestens 3 Komponenten («component») sind im Diagramm angelegt",
            nodeKind: "component",
            minCount: 3,
            hintOnMissing:
              "Platziere mindestens 3 Komponenten (z. B. „PlayerApp“, „StreamingService“, „KatalogService“).",
          },
          {
            type: "node",
            id: "cmp4-ifc",
            description:
              "Mindestens 1 Schnittstelle (Lollipop, Socket oder «interface») ist vorhanden",
            nodeKind: ["provided-interface", "required-interface", "interface"],
            minCount: 1,
            hintOnMissing:
              "Füge mindestens eine angebotene Schnittstelle (Lollipop) hinzu.",
          },
          {
            type: "edge",
            id: "cmp4-edges",
            description:
              "Die Komponenten und Schnittstellen sind miteinander verbunden",
            edgeKind: [
              "dependency",
              "realization",
              "assembly-connector",
              "directed-association",
            ],
            sourceNodeKind: "component",
            hintOnMissing:
              "Verbinde die Komponenten über Abhängigkeiten (- - >), Realisierungen (- - ▷) oder Schnittstellen-Kopplungen.",
          },
        ],
        celebrationMessage:
          "GRANDIOS! Du hast alle 6 Etappen der UML-2.5.1-Systemdenker-Akademie abgeschlossen!",
      },
    ],
  },
];

/**
 * Deterministic target option index (0, 1, or 2) for each lesson's VisualCheckQuestion
 * so the correct answer is evenly distributed across Option 1, Option 2, and Option 3.
 */
const TARGET_QUIZ_INDEX_BY_LESSON_ID: Record<string, number> = {
  "uc-1-boxes": 1,
  "uc-2-connections": 2,
  "uc-3-detective": 1,
  "uc-4-capstone": 2,
  "cls-1-boxes": 1,
  "cls-2-connections": 2,
  "cls-3-detective": 0,
  "cls-4-capstone": 1,
  "act-1-boxes": 2,
  "act-2-connections": 1,
  "act-3-detective": 2,
  "act-4-capstone": 0,
  "stm-1-boxes": 1,
  "stm-2-connections": 2,
  "stm-3-detective": 1,
  "stm-4-capstone": 0,
  "seq-1-boxes": 2,
  "seq-2-connections": 1,
  "seq-3-detective": 2,
  "seq-4-capstone": 0,
  "cmp-1-boxes": 1,
  "cmp-2-connections": 1,
  "cmp-3-detective": 0,
  "cmp-4-capstone": 2,
};

function applyTargetQuizIndex(
  question: VisualCheckQuestion,
  targetIndex: number,
): VisualCheckQuestion {
  const options = [...question.options];
  const currentIdx = question.correctIndex;
  if (
    targetIndex >= 0 &&
    targetIndex < options.length &&
    currentIdx >= 0 &&
    currentIdx < options.length &&
    currentIdx !== targetIndex
  ) {
    const temp = options[targetIndex];
    options[targetIndex] = options[currentIdx];
    options[currentIdx] = temp;
    return {
      ...question,
      options,
      correctIndex: targetIndex,
    };
  }
  return {
    ...question,
    options,
  };
}

/**
 * Bilingual domain name synonyms so learners can name UML elements in either
 * German or English regardless of the active UI language.
 */
const BILINGUAL_SYNONYMS: Record<string, string[]> = {
  Fahrgast: ["Passenger", "Customer", "Traveler", "Commuter", "User"],
  "Ticket kaufen": ["Buy Ticket", "Purchase Ticket", "Book Ticket"],
  Bezahlen: ["Pay", "Process Payment", "Make Payment", "Payment"],
  "Bahncard-Rabatt nutzen": [
    "Use Railcard Discount",
    "Redeem Discount",
    "Apply Discount",
    "Discount",
  ],
  Rabatt: ["Discount", "Use Railcard Discount", "Redeem Discount"],
  Bankkunde: ["Bank Customer", "Customer", "Client", "Account Holder"],
  "Überweisung tätigen": [
    "Make Transfer",
    "Transfer Money",
    "Wire Transfer",
    "Send Transfer",
  ],
  "Spendenbeleg drucken": [
    "Print Donation Receipt",
    "Print Receipt",
    "Donation Receipt",
  ],
  Bewohner: ["Resident", "Tenant", "Homeowner", "Owner", "User"],
  "Tür entriegeln": ["Unlock Door", "Open Door", "Unlock"],
  "Zugangscode prüfen": [
    "Verify Access Code",
    "Check Access Code",
    "Check PIN",
    "Verify PIN",
    "Validate Code",
  ],
  "Alarm auslösen": ["Trigger Alarm", "Sound Alarm", "Raise Alarm", "Alarm"],
  Buch: ["Book", "Volume"],
  Ausleihbar: ["Borrowable", "IBorrowable", "Loanable", "Rentable"],
  Bestellung: ["Order", "PurchaseOrder"],
  Bestellposition: ["OrderItem", "LineItem", "OrderLine", "Order Item"],
  EBook: ["EBook", "E-Book", "DigitalBook"],
  Flotte: ["Fleet", "VehicleFleet"],
  Fahrzeug: ["Vehicle", "Car", "Auto"],
  Elektroauto: ["ElectricCar", "EV", "ElectricVehicle", "Electric Car"],
  Kurs: ["Course", "ClassCourse", "TrainingCourse"],
  Lektion: ["Lesson", "Unit", "Module"],
  VideoLektion: ["VideoLesson", "Video Lesson", "VideoUnit"],
  Teilnehmer: ["Student", "Participant", "Learner", "Attendee", "Member"],
  "Kaffee mahlen": ["Grind Coffee", "Grind Beans"],
  "Espresso brühen": ["Brew Espresso", "Extract Espresso", "Make Espresso"],
  "Bestellung prüfen": ["Verify Order", "Check Order", "Validate Order"],
  "Expressversand starten": [
    "Start Express Shipping",
    "Express Shipping",
    "Ship Express",
  ],
  "Standardversand starten": [
    "Start Standard Shipping",
    "Standard Shipping",
    "Ship Standard",
  ],
  "Bonität prüfen": ["Check Credit Score", "Check Credit", "Verify Credit"],
  "Kredit genehmigen": ["Approve Loan", "Grant Loan", "Approve Credit"],
  "Antrag ablehnen": ["Reject Application", "Deny Loan", "Decline Application"],
  "Bestellung empfangen": ["Receive Order", "Order Received", "Accept Order"],
  "Ware verpacken": ["Pack Goods", "Pack Items", "Package Order"],
  "Rechnung erstellen": ["Create Invoice", "Generate Invoice", "Send Invoice"],
  Entwurf: ["Draft", "New", "Created"],
  Veröffentlicht: ["Published", "Active", "Live", "Released"],
  Offen: ["Open", "Pending", "New"],
  Bezahlt: ["Paid", "Settled"],
  Storniert: ["Cancelled", "Canceled", "Voided"],
  Geliefert: ["Delivered", "Shipped", "Completed"],
  Frei: ["Free", "Available", "Empty", "Idle", "Ready"],
  Belegt: ["Occupied", "Busy", "In Use", "Reserved", "Locked"],
  Kunde: ["Customer", "Buyer", "Client", "Shopper", "User"],
  ":Webshop": [
    ":Webshop",
    "Webshop",
    ":OnlineShop",
    "OnlineShop",
    ":Shop",
    "Shop",
  ],
  Webshop: [
    ":Webshop",
    "Webshop",
    ":OnlineShop",
    "OnlineShop",
    ":Shop",
    "Shop",
  ],
  ":Zahlungsdienst": [
    ":PaymentService",
    "PaymentService",
    ":PaymentGateway",
    "PaymentGateway",
    "Payment",
  ],
  Zahlungsdienst: [
    ":PaymentService",
    "PaymentService",
    ":PaymentGateway",
    "PaymentGateway",
    "Payment",
  ],
  ":E-Mail-Service": [
    ":EmailService",
    "EmailService",
    ":MailService",
    "MailService",
    "Email",
  ],
  "E-Mail-Service": [
    ":EmailService",
    "EmailService",
    ":MailService",
    "MailService",
    "Email",
  ],
  ":App": [":App", "App", ":ClientApp", "ClientApp"],
  ":AuthServer": [":AuthServer", "AuthServer", ":AuthService", "AuthService"],
  Besucher: ["Visitor", "Guest", "Moviegoer", "Customer", "User"],
  ":BuchungsService": [
    ":BookingService",
    "BookingService",
    ":ReservationService",
    "ReservationService",
  ],
  BuchungsService: [
    ":BookingService",
    "BookingService",
    ":ReservationService",
    "ReservationService",
  ],
  ":SaalplanDB": [
    ":SeatMapDB",
    "SeatMapDB",
    ":SeatingDB",
    "SeatingDB",
    ":Database",
    "Database",
    ":HallPlanDB",
    "HallPlanDB",
  ],
  SaalplanDB: [
    ":SeatMapDB",
    "SeatMapDB",
    ":SeatingDB",
    "SeatingDB",
    ":Database",
    "Database",
    ":HallPlanDB",
    "HallPlanDB",
  ],
  BestellService: ["OrderService", "OrderComponent", "CheckoutService"],
  ZahlungsGateway: ["PaymentGateway", "PaymentService", "PaymentAdapter"],
  IZahlung: ["IPayment", "PaymentInterface", "PaymentAPI"],
  WebFrontend: ["WebFrontend", "Frontend", "UI", "WebUI"],
  KernService: ["CoreService", "DomainService", "ApplicationCore", "Core"],
  DatenbankAdapter: ["DatabaseAdapter", "DbAdapter", "PersistenceAdapter"],
};

function expandBilingualNames(names?: string[]): string[] | undefined {
  if (!names || names.length === 0) return names;
  const result = new Set<string>(names);
  for (const name of names) {
    const extras = BILINGUAL_SYNONYMS[name];
    if (extras) {
      for (const extra of extras) {
        result.add(extra);
      }
    }
  }
  return Array.from(result);
}

// Enrich LEARNING_STAGES in place with varied quiz indices, Level 2 scenarios,
// and bilingual criterion name lists.
for (const stage of LEARNING_STAGES) {
  for (const lesson of stage.lessons) {
    const targetQuizIdx = TARGET_QUIZ_INDEX_BY_LESSON_ID[lesson.id] ?? 1;
    lesson.visualCheck = applyTargetQuizIndex(
      lesson.visualCheck,
      targetQuizIdx,
    );
    lesson.level2ScenarioPrompt =
      DE_LEVEL2_SCENARIOS[lesson.id] ?? lesson.taskPrompt;

    lesson.criteria = lesson.criteria.map((criterion) => {
      if (criterion.type === "node") {
        return {
          ...criterion,
          acceptedNames: expandBilingualNames(criterion.acceptedNames),
        };
      }
      if (criterion.type === "edge") {
        return {
          ...criterion,
          sourceNodeNames: expandBilingualNames(criterion.sourceNodeNames),
          targetNodeNames: expandBilingualNames(criterion.targetNodeNames),
        };
      }
      if (criterion.type === "forbidden-edge") {
        return {
          ...criterion,
          sourceNodeNames:
            expandBilingualNames(criterion.sourceNodeNames) ?? [],
          targetNodeNames:
            expandBilingualNames(criterion.targetNodeNames) ?? [],
        };
      }
      return criterion;
    });
  }
}

const ATTRIBUTE_NAME_EN: Record<string, string> = {
  titel: "title",
  datum: "date",
  menge: "quantity",
  dateiGroesseMB: "fileSizeMB",
  standort: "location",
  kennzeichen: "licensePlate",
  akkuKapazitaetKWh: "batteryCapacityKWh",
  dauerMinuten: "durationMinutes",
};

const OPERATION_NAME_EN: Record<string, string> = {
  istVerfuegbar: "isAvailable",
  ausleihen: "borrow",
  oeffnen: "open",
  veroeffentlichen: "publish",
};

const STATE_ACTIVITY_EN: Record<string, string> = {
  "speichereEntwurf()": "saveDraft()",
  "bearbeitenErlaubt()": "allowEditing()",
  "sendeBenachrichtigung()": "sendNotification()",
  "erzeugeId()": "generateId()",
  "indexiereSuche()": "indexForSearch()",
  "grueneLEDAn()": "turnOnGreenLED()",
  "verriegeln() & sendeAbholcode()": "lockDoor() & sendPickupCode()",
};

function localizeDiagramToEn(
  diagram: UmlDiagram,
  lessonId: string,
): UmlDiagram {
  const loc = EN_LESSONS[lessonId];
  const nodeTranslations = loc?.nodeTranslations ?? {};
  const edgeTranslations = loc?.edgeLabelTranslations ?? {};

  return {
    ...diagram,
    nodes: diagram.nodes.map((node) => ({
      ...node,
      name: nodeTranslations[node.id] ?? node.name,
      attributes: node.attributes.map((attr) => ({
        ...attr,
        name: ATTRIBUTE_NAME_EN[attr.name] ?? attr.name,
      })),
      operations: node.operations.map((op) => ({
        ...op,
        name: OPERATION_NAME_EN[op.name] ?? op.name,
      })),
      stateActivities: node.stateActivities
        ? {
            entry: node.stateActivities.entry
              ? (STATE_ACTIVITY_EN[node.stateActivities.entry] ??
                node.stateActivities.entry)
              : undefined,
            doActivity: node.stateActivities.doActivity
              ? (STATE_ACTIVITY_EN[node.stateActivities.doActivity] ??
                node.stateActivities.doActivity)
              : undefined,
            exit: node.stateActivities.exit
              ? (STATE_ACTIVITY_EN[node.stateActivities.exit] ??
                node.stateActivities.exit)
              : undefined,
          }
        : undefined,
    })),
    edges: diagram.edges.map((edge) => {
      const edgeLoc = edgeTranslations[edge.id];
      return {
        ...edge,
        label: edgeLoc?.label ?? edge.label,
        guard: edgeLoc?.guard ?? edge.guard,
      };
    }),
  };
}

let cachedEnStages: LearningStage[] | null = null;

export function getLearningStages(locale: AppLocale = "de"): LearningStage[] {
  if (locale === "de") {
    return LEARNING_STAGES;
  }
  if (cachedEnStages) {
    return cachedEnStages;
  }

  cachedEnStages = LEARNING_STAGES.map((stage) => {
    const stageLoc = EN_STAGES[stage.id];
    return {
      ...stage,
      title: stageLoc?.title ?? stage.title,
      subtitle: stageLoc?.subtitle ?? stage.subtitle,
      badgeTitle: stageLoc?.badgeTitle ?? stage.badgeTitle,
      expressionSkillSummary:
        stageLoc?.expressionSkillSummary ?? stage.expressionSkillSummary,
      celebrationHeadline:
        stageLoc?.celebrationHeadline ?? stage.celebrationHeadline,
      celebrationBody: stageLoc?.celebrationBody ?? stage.celebrationBody,
      unlockedElementsSummary:
        stageLoc?.unlockedElementsSummary ?? stage.unlockedElementsSummary,
      lessons: stage.lessons.map((lesson) => {
        const lessonLoc = EN_LESSONS[lesson.id];
        if (!lessonLoc) return lesson;
        const targetQuizIdx = TARGET_QUIZ_INDEX_BY_LESSON_ID[lesson.id] ?? 1;
        return {
          ...lesson,
          title: lessonLoc.title,
          subtitle: lessonLoc.subtitle,
          whyItMatters: lessonLoc.whyItMatters,
          explanationHtml: lessonLoc.explanationHtml,
          visualCheck: applyTargetQuizIndex(
            lessonLoc.visualCheck,
            targetQuizIdx,
          ),
          taskPrompt: lessonLoc.taskPrompt,
          level2ScenarioPrompt: lessonLoc.level2ScenarioPrompt,
          celebrationMessage: lessonLoc.celebrationMessage,
          starterDiagram: localizeDiagramToEn(lesson.starterDiagram, lesson.id),
          sampleSolutionDiagram: localizeDiagramToEn(
            lesson.sampleSolutionDiagram,
            lesson.id,
          ),
          criteria: lesson.criteria.map((criterion) => {
            const cLoc = lessonLoc.criteriaDescriptions[criterion.id];
            if (!cLoc) return criterion;
            if (criterion.type === "node" || criterion.type === "edge") {
              return {
                ...criterion,
                description: cLoc.description,
                hintOnMissing: cLoc.hint,
              };
            }
            if (criterion.type === "structural") {
              return {
                ...criterion,
                description: cLoc.description,
                hintOnViolation: cLoc.hint,
              };
            }
            if (criterion.type === "forbidden-edge") {
              return {
                ...criterion,
                description: cLoc.description,
                hintWhenStillPresent: cLoc.hint,
              };
            }
            return criterion;
          }),
        };
      }),
    };
  });

  return cachedEnStages;
}

export function getAllLessons(locale: AppLocale = "de"): LearningLesson[] {
  return getLearningStages(locale).flatMap((stage) => stage.lessons);
}

export function findLessonById(
  lessonId: string,
  locale: AppLocale = "de",
): {
  stage: LearningStage;
  lesson: LearningLesson;
} | null {
  for (const stage of getLearningStages(locale)) {
    const lesson = stage.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      return { stage, lesson };
    }
  }
  return null;
}

/**
 * Returns the starter diagram for a lesson according to the chosen difficulty level:
 * - Level 1 (Guided): Pre-populated starter diagram so the learner can focus on the step.
 * - Level 2 (System Translation): Blank canvas (except in bug-detective lessons, where the
 *   faulty diagram is the subject of inspection) so the learner translates the system
 *   description into UML 2.5.1 on their own.
 */
export function getStarterDiagramForLevel(
  lesson: LearningLesson,
  level: DifficultyLevel,
): UmlDiagram {
  if (level === 1 || lesson.mode === "bug-detective") {
    return structuredClone(lesson.starterDiagram);
  }
  return {
    id: `${lesson.starterDiagram.id}-l2`,
    title: lesson.starterDiagram.title,
    diagramType: lesson.starterDiagram.diagramType,
    nodes: [],
    edges: [],
    updatedAt: new Date().toISOString(),
  };
}
