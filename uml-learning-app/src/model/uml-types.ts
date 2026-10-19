/**
 * UML 2.5.1 Metamodel & Diagram Types
 * Supports all 14 official OMG UML 2.5.1 diagram types with deep visual and semantic
 * modeling for the 6 primary diagram families (Use Case, Class, Activity, State Machine,
 * Sequence, Component) while keeping the architecture open for all 14 types.
 */

export type UmlDiagramCategory = "structure" | "behavior";

export type UmlDiagramType =
  // 6 Core Learning Path Diagrams
  | "use-case"
  | "class"
  | "activity"
  | "state-machine"
  | "sequence"
  | "component"
  // Additional 8 UML 2.5.1 Diagram Types (available in Free Studio)
  | "package"
  | "object"
  | "deployment"
  | "composite-structure"
  | "communication"
  | "interaction-overview"
  | "timing"
  | "profile";

export type UmlVisibility = "+" | "-" | "#" | "~";

export interface UmlAttribute {
  id: string;
  visibility: UmlVisibility;
  isDerived?: boolean;
  isStatic?: boolean;
  name: string;
  type: string;
  multiplicity?: string;
  defaultValue?: string;
}

export interface UmlOperation {
  id: string;
  visibility: UmlVisibility;
  isAbstract?: boolean;
  isStatic?: boolean;
  name: string;
  parameters: string;
  returnType: string;
}

export type UmlNodeKind =
  // Use Case Diagram
  | "actor"
  | "use-case"
  | "system-boundary"
  // Class / Object / Package / Profile Diagram
  | "class"
  | "abstract-class"
  | "interface"
  | "enum"
  | "package"
  | "object"
  // Activity Diagram
  | "initial-node"
  | "activity-final"
  | "flow-final"
  | "action"
  | "decision-merge"
  | "fork-join"
  | "object-node"
  | "swimlane"
  // State Machine Diagram
  | "initial-state"
  | "state"
  | "final-state"
  | "choice-pseudostate"
  // Sequence / Communication Diagram
  | "lifeline"
  | "actor-lifeline"
  | "combined-fragment"
  // Component / Deployment / Composite Structure Diagram
  | "component"
  | "provided-interface"
  | "required-interface"
  | "port"
  | "deployment-node"
  // Universal
  | "note";

export type UmlEdgeKind =
  // Structural & Use Case Relationships
  | "association"
  | "directed-association"
  | "aggregation"
  | "composition"
  | "generalization"
  | "realization"
  | "dependency"
  | "include"
  | "extend"
  | "assembly-connector"
  // Behavioral Flows & Transitions
  | "control-flow"
  | "transition"
  // Interaction Messages (Sequence)
  | "sync-message"
  | "async-message"
  | "return-message"
  // Universal
  | "note-link";

export interface UmlNode {
  id: string;
  kind: UmlNodeKind;
  name: string;
  stereotype?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isAbstract?: boolean;
  attributes: UmlAttribute[];
  operations: UmlOperation[];
  /** State machine internal activities (entry / ..., do / ..., exit / ...) */
  stateActivities?: {
    entry?: string;
    doActivity?: string;
    exit?: string;
  };
  /** Combined fragment operator (alt, opt, loop, par) and guard */
  fragmentOperator?: "alt" | "opt" | "loop" | "par" | "region";
  fragmentGuard?: string;
  /** Optional note text or documentation */
  documentation?: string;
  /** Optional custom accent color */
  accentColor?: string;
}

export interface UmlEdge {
  id: string;
  kind: UmlEdgeKind;
  sourceId: string;
  targetId: string;
  label?: string;
  stereotype?: string;
  guard?: string;
  sourceRole?: string;
  targetRole?: string;
  sourceMultiplicity?: string;
  targetMultiplicity?: string;
  /** Vertical offset on sequence lifelines (0..1 or pixel Y) */
  sequenceOrder?: number;
}

export interface UmlDiagram {
  id: string;
  title: string;
  diagramType: UmlDiagramType;
  description?: string;
  nodes: UmlNode[];
  edges: UmlEdge[];
  updatedAt: string;
}

export interface UmlDiagramTypeMeta {
  type: UmlDiagramType;
  name: string;
  englishName: string;
  category: UmlDiagramCategory;
  isCoreLearningPath: boolean;
  icon: string;
  shortDescription: string;
  whenToUse: string;
  recommendedNodes: UmlNodeKind[];
  recommendedEdges: UmlEdgeKind[];
}

export interface UmlNodeKindMeta {
  kind: UmlNodeKind;
  label: string;
  umlTerm: string;
  diagramTypes: UmlDiagramType[];
  defaultWidth: number;
  defaultHeight: number;
  isContainer?: boolean;
  defaultStereotype?: string;
  shortHint: string;
  meaning: string;
}

export interface UmlEdgeKindMeta {
  kind: UmlEdgeKind;
  label: string;
  umlTerm: string;
  diagramTypes: UmlDiagramType[];
  lineStyle: "solid" | "dashed";
  sourceMarker: "none" | "hollow-diamond" | "filled-diamond" | "socket";
  targetMarker:
    | "none"
    | "open-arrow"
    | "filled-triangle"
    | "hollow-triangle"
    | "lollipop";
  fixedStereotype?: string;
  shortHint: string;
  meaning: string;
  directionRule: string;
}

export const UML_DIAGRAM_TYPES: Record<UmlDiagramType, UmlDiagramTypeMeta> = {
  "use-case": {
    type: "use-case",
    name: "Anwendungsfalldiagramm",
    englishName: "Use Case Diagram",
    category: "behavior",
    isCoreLearningPath: true,
    icon: "🎭",
    shortDescription:
      "Zeigt aus Nutzersicht, WER (Akteure) WAS (Anwendungsfälle) mit einem System erreichen möchte.",
    whenToUse:
      "Ganz am Anfang einer Idee: Systemgrenze abstecken und den Nutzen für Menschen und Nachbarsysteme klären.",
    recommendedNodes: ["actor", "use-case", "system-boundary", "note"],
    recommendedEdges: [
      "association",
      "include",
      "extend",
      "generalization",
      "note-link",
    ],
  },
  class: {
    type: "class",
    name: "Klassendiagramm",
    englishName: "Class Diagram",
    category: "structure",
    isCoreLearningPath: true,
    icon: "🏛️",
    shortDescription:
      "Beschreibt die Bausteine einer Domäne (Klassen, Schnittstellen), ihre Eigenschaften und ihre Beziehungen.",
    whenToUse:
      "Wenn du die Begriffe deines Systems, ihre Datenstruktur und Zusammenhänge wie Teil-Ganzes oder Vererbung modellierst.",
    recommendedNodes: [
      "class",
      "abstract-class",
      "interface",
      "enum",
      "package",
      "note",
    ],
    recommendedEdges: [
      "association",
      "directed-association",
      "aggregation",
      "composition",
      "generalization",
      "realization",
      "dependency",
      "note-link",
    ],
  },
  activity: {
    type: "activity",
    name: "Aktivitätsdiagramm",
    englishName: "Activity Diagram",
    category: "behavior",
    isCoreLearningPath: true,
    icon: "⚡",
    shortDescription:
      "Visualisiert Abläufe, Schritt-für-Schritt-Prozesse, Entscheidungen und parallele Pfade.",
    whenToUse:
      "Wenn du verstehen oder erklären willst, wie ein Geschäftsprozess oder Algorithmus Schritt für Schritt abläuft.",
    recommendedNodes: [
      "initial-node",
      "action",
      "decision-merge",
      "fork-join",
      "object-node",
      "activity-final",
      "flow-final",
      "swimlane",
      "note",
    ],
    recommendedEdges: ["control-flow", "note-link"],
  },
  "state-machine": {
    type: "state-machine",
    name: "Zustandsdiagramm",
    englishName: "State Machine Diagram",
    category: "behavior",
    isCoreLearningPath: true,
    icon: "🔄",
    shortDescription:
      "Zeigt alle Zustände eines Objekts oder Systems und welche Ereignisse Zustandswechsel auslösen.",
    whenToUse:
      "Wenn ein Ding (z. B. Bestellung, Türschloss, Ticket) einen klaren Lebenszyklus mit erlaubten und verbotenen Übergängen hat.",
    recommendedNodes: [
      "initial-state",
      "state",
      "choice-pseudostate",
      "final-state",
      "note",
    ],
    recommendedEdges: ["transition", "note-link"],
  },
  sequence: {
    type: "sequence",
    name: "Sequenzdiagramm",
    englishName: "Sequence Diagram",
    category: "behavior",
    isCoreLearningPath: true,
    icon: "⏱️",
    shortDescription:
      "Stellt den zeitlichen Nachrichtenaustausch zwischen Lebenslinien von oben nach unten dar.",
    whenToUse:
      "Wenn du das exakte Zusammenspiel mehrerer Komponenten oder Objekte über die Zeit für ein Szenario nachvollziehen willst.",
    recommendedNodes: [
      "actor-lifeline",
      "lifeline",
      "combined-fragment",
      "note",
    ],
    recommendedEdges: [
      "sync-message",
      "async-message",
      "return-message",
      "note-link",
    ],
  },
  component: {
    type: "component",
    name: "Komponentendiagramm",
    englishName: "Component Diagram",
    category: "structure",
    isCoreLearningPath: true,
    icon: "🧩",
    shortDescription:
      "Zeigt modulare Systembausteine (Komponenten), ihre angebotenen und benötigten Schnittstellen sowie Abhängigkeiten.",
    whenToUse:
      "Für die Systemarchitektur im Großen: Wie werden Module sauber über Schnittstellen entkoppelt?",
    recommendedNodes: [
      "component",
      "provided-interface",
      "required-interface",
      "port",
      "package",
      "note",
    ],
    recommendedEdges: [
      "assembly-connector",
      "dependency",
      "realization",
      "directed-association",
      "note-link",
    ],
  },
  package: {
    type: "package",
    name: "Paketdiagramm",
    englishName: "Package Diagram",
    category: "structure",
    isCoreLearningPath: false,
    icon: "📦",
    shortDescription:
      "Gruppiert Modellelemente in logische Namensräume (Pakete) und zeigt deren Import-/Abhängigkeitsstruktur.",
    whenToUse:
      "Um Schichtenarchitekturen und Modul-Abhängigkeiten auf oberster Ebene zu ordnen.",
    recommendedNodes: ["package", "class", "component", "note"],
    recommendedEdges: ["dependency", "note-link"],
  },
  object: {
    type: "object",
    name: "Objektdiagramm",
    englishName: "Object Diagram",
    category: "structure",
    isCoreLearningPath: false,
    icon: "📸",
    shortDescription:
      "Eine Momentaufnahme (Snapshot) konkreter Instanzen und ihrer Attributwerte zu einem bestimmten Zeitpunkt.",
    whenToUse:
      "Um ein abstraktes Klassendiagramm anhand eines konkreten Beispielszenarios zu überprüfen.",
    recommendedNodes: ["object", "note"],
    recommendedEdges: ["association", "directed-association", "note-link"],
  },
  deployment: {
    type: "deployment",
    name: "Verteilungsdiagramm",
    englishName: "Deployment Diagram",
    category: "structure",
    isCoreLearningPath: false,
    icon: "🖥️",
    shortDescription:
      "Zeigt die physische oder virtuelle Laufzeit-Infrastruktur (Server, Container, Geräte) und die darauf verteilten Artefakte.",
    whenToUse:
      "Wenn du Cloud-Knoten, Server, Datenbanken und Kommunikationsprotokolle visualisierst.",
    recommendedNodes: ["deployment-node", "component", "note"],
    recommendedEdges: ["association", "dependency", "note-link"],
  },
  "composite-structure": {
    type: "composite-structure",
    name: "Kompositionsstrukturdiagramm",
    englishName: "Composite Structure Diagram",
    category: "structure",
    isCoreLearningPath: false,
    icon: "🔬",
    shortDescription:
      "Blickt in das Innere einer Klasse oder Komponente: Teile (Parts), Ports und innere Konnektoren.",
    whenToUse:
      "Wenn das innere Zusammenspiel eines komplexen Bausteins detailliert gezeigt werden soll.",
    recommendedNodes: ["component", "port", "class", "note"],
    recommendedEdges: ["association", "assembly-connector", "note-link"],
  },
  communication: {
    type: "communication",
    name: "Kommunikationsdiagramm",
    englishName: "Communication Diagram",
    category: "behavior",
    isCoreLearningPath: false,
    icon: "🕸️",
    shortDescription:
      "Betont die strukturellen Verbindungen zwischen zusammenarbeitenden Objekten mit durchnummerierten Nachrichten (1, 1.1, 2).",
    whenToUse:
      "Als kompakte Alternative zum Sequenzdiagramm, wenn das Beziehungsnetz wichtiger ist als die Zeitachse.",
    recommendedNodes: ["object", "actor", "note"],
    recommendedEdges: ["directed-association", "sync-message", "note-link"],
  },
  "interaction-overview": {
    type: "interaction-overview",
    name: "Interaktionsübersichtsdiagramm",
    englishName: "Interaction Overview Diagram",
    category: "behavior",
    isCoreLearningPath: false,
    icon: "🗺️",
    shortDescription:
      "Kombiniert ein Aktivitätsdiagramm mit eingebetteten Interaktions-Rahmen (Sequenzfragmenten).",
    whenToUse:
      "Um den Kontrollfluss zwischen mehreren einzelnen Sequenz-Szenarien darzustellen.",
    recommendedNodes: [
      "initial-node",
      "action",
      "decision-merge",
      "combined-fragment",
      "activity-final",
      "note",
    ],
    recommendedEdges: ["control-flow", "note-link"],
  },
  timing: {
    type: "timing",
    name: "Zeitverlaufsdiagramm",
    englishName: "Timing Diagram",
    category: "behavior",
    isCoreLearningPath: false,
    icon: "📈",
    shortDescription:
      "Fokussiert auf exakte Zeitbedingungen und Zustandswechsel entlang einer messbaren Zeitachse.",
    whenToUse:
      "Bei Echtzeitsystemen, Hardware-Protokollen oder strikten SLA-/Timeout-Anforderungen.",
    recommendedNodes: ["state", "lifeline", "note"],
    recommendedEdges: ["transition", "async-message", "note-link"],
  },
  profile: {
    type: "profile",
    name: "Profildiagramm",
    englishName: "Profile Diagram",
    category: "structure",
    isCoreLearningPath: false,
    icon: "🏷️",
    shortDescription:
      "Erweitert das UML-Metamodell selbst durch eigene Stereotypen («stereotype») und Eigenschaftswerte (Tagged Values).",
    whenToUse:
      "Wenn du UML für eine spezielle Domäne (z. B. Medizintechnik, Cloud, Automotive) maßschneiderst.",
    recommendedNodes: ["class", "package", "note"],
    recommendedEdges: ["generalization", "dependency", "note-link"],
  },
};

export const UML_NODE_KINDS: Record<UmlNodeKind, UmlNodeKindMeta> = {
  actor: {
    kind: "actor",
    label: "Akteur",
    umlTerm: "Actor",
    diagramTypes: ["use-case", "communication"],
    defaultWidth: 90,
    defaultHeight: 110,
    shortHint:
      "Menschliche Rolle oder externes System außerhalb der Systemgrenze",
    meaning:
      "Ein Akteur (Strichmännchen) repräsentiert eine Rolle, die ein Mensch oder ein externes System einnimmt, wenn es mit deinem System interagiert. Wichtig: Akteure stehen immer AUSSERHALB der Systemgrenze!",
  },
  "use-case": {
    kind: "use-case",
    label: "Anwendungsfall",
    umlTerm: "Use Case",
    diagramTypes: ["use-case"],
    defaultWidth: 170,
    defaultHeight: 74,
    shortHint:
      "Ein konkretes Ziel aus Nutzersicht (Substantiv + Verb, z. B. „Ticket buchen“)",
    meaning:
      "Eine Ellipse beschreibt einen abgeschlossenen Mehrwert, den das System für einen Akteur liefert – kein technisches Detail, sondern ein sichtbares Ergebnis wie „Geld abheben“ oder „Bestellung aufgeben“.",
  },
  "system-boundary": {
    kind: "system-boundary",
    label: "Systemgrenze",
    umlTerm: "System Boundary (Subject)",
    diagramTypes: ["use-case"],
    defaultWidth: 360,
    defaultHeight: 300,
    isContainer: true,
    defaultStereotype: "system",
    shortHint: "Rahmen um alle Anwendungsfälle, die zu deinem System gehören",
    meaning:
      "Die Systemgrenze trennt klar, was Teil deines zu bauenden Systems ist (innen: die Anwendungsfälle) und was außerhalb liegt (außen: die Akteure). Das schafft sofort Klarheit über den Projektumfang.",
  },
  class: {
    kind: "class",
    label: "Klasse",
    umlTerm: "Class",
    diagramTypes: ["class", "package", "composite-structure", "profile"],
    defaultWidth: 190,
    defaultHeight: 126,
    shortHint:
      "Bauplan für gleichartige Objekte mit Namen, Attributen und Operationen",
    meaning:
      "Das Herzstück der Strukturmodellierung: Ein Rechteck mit drei Abteilen (Kompartimenten). Oben der Klassenname im Singular (z. B. `Konto`), in der Mitte die Attribute (`- saldo: Euro`) und unten die Operationen (`+ einzahlen(betrag: Euro): void`).",
  },
  "abstract-class": {
    kind: "abstract-class",
    label: "Abstrakte Klasse",
    umlTerm: "Abstract Class",
    diagramTypes: ["class"],
    defaultWidth: 190,
    defaultHeight: 120,
    defaultStereotype: "abstract",
    shortHint:
      "Oberbegriff, von dem keine direkten Instanzen erzeugt werden können (Name kursiv)",
    meaning:
      "Eine abstrakte Klasse bündelt gemeinsame Attribute und Methoden für Unterklassen (z. B. `Fahrzeug` für `Auto` und `Fahrrad`), kann aber selbst nicht direkt instanziiert werden. In UML 2.5.1 wird ihr Name kursiv dargestellt.",
  },
  interface: {
    kind: "interface",
    label: "Schnittstelle",
    umlTerm: "Interface («interface»)",
    diagramTypes: ["class", "component"],
    defaultWidth: 190,
    defaultHeight: 110,
    defaultStereotype: "interface",
    shortHint: "Vertrag aus Methodensignaturen mit Stereotyp «interface»",
    meaning:
      "Eine Schnittstelle legt fest, WAS ein Baustein können muss (Methodenvertrag), ohne vorzuschreiben, WIE er es intern umsetzt. Klassen realisieren sie über einen gestrichelten Vererbungspfeil.",
  },
  enum: {
    kind: "enum",
    label: "Aufzählung",
    umlTerm: "Enumeration («enumeration»)",
    diagramTypes: ["class"],
    defaultWidth: 165,
    defaultHeight: 110,
    defaultStereotype: "enumeration",
    shortHint:
      "Feste Menge erlaubter Werte (z. B. Status: OFFEN, BEZAHLT, STORNIERT)",
    meaning:
      "Eine Enumeration definiert eine abgeschlossene Liste benannter Konstanten. Damit verhinderst du unklare Freitext-Zustände in deinem Modell.",
  },
  package: {
    kind: "package",
    label: "Paket",
    umlTerm: "Package",
    diagramTypes: ["package", "class", "component", "profile"],
    defaultWidth: 280,
    defaultHeight: 200,
    isContainer: true,
    shortHint:
      "Ordner-Symbol zur logischen Gruppierung von Klassen oder Komponenten",
    meaning:
      "Ein Paket fasst zusammengehörige Modellelemente in einem eigenen Namensraum zusammen (erkennbar am kleinen Reiter oben links).",
  },
  object: {
    kind: "object",
    label: "Objekt (Instanz)",
    umlTerm: "InstanceSpecification",
    diagramTypes: ["object", "communication"],
    defaultWidth: 180,
    defaultHeight: 96,
    shortHint: "Konkrete Instanz im Format `meinAuto : Auto` (unterstrichen)",
    meaning:
      "Während eine Klasse der allgemeine Bauplan ist, zeigt ein Objekt-Knoten ein konkretes Exemplar zur Laufzeit mit echten Attributwerten. Erkennbar am unterstrichenen Text `instanzname : Klassenname`.",
  },
  "initial-node": {
    kind: "initial-node",
    label: "Startknoten",
    umlTerm: "Initial Node",
    diagramTypes: ["activity", "interaction-overview"],
    defaultWidth: 36,
    defaultHeight: 36,
    shortHint: "Ausgefüllter Kreis (●): Hier beginnt der Ablauf der Aktivität",
    meaning:
      "Der ausgefüllte schwarze Punkt markiert den eindeutigen Einstiegspunkt eines Aktivitätsdiagramms. Sobald die Aktivität startet, fließt von hier ein Kontroll-Token los.",
  },
  "activity-final": {
    kind: "activity-final",
    label: "Aktivitätsende",
    umlTerm: "Activity Final Node",
    diagramTypes: ["activity", "interaction-overview"],
    defaultWidth: 40,
    defaultHeight: 40,
    shortHint: "Bullauge (◉): Beendet die gesamte Aktivität sofort",
    meaning:
      "Ein ausgefüllter Punkt mit einem äußeren Ring (Bullauge). Erreicht ein Pfad diesen Knoten, wird die gesamte Aktivität abgeschlossen.",
  },
  "flow-final": {
    kind: "flow-final",
    label: "Flussende",
    umlTerm: "Flow Final Node",
    diagramTypes: ["activity"],
    defaultWidth: 38,
    defaultHeight: 38,
    shortHint:
      "Kreis mit Kreuz (⊗): Beendet nur diesen einzelnen parallelen Zweig",
    meaning:
      "Beendet nur den lokalen Kontrollfluss-Zweig, während andere parallele Zweige der Aktivität weiterlaufen dürfen.",
  },
  action: {
    kind: "action",
    label: "Aktion",
    umlTerm: "Action",
    diagramTypes: ["activity", "interaction-overview"],
    defaultWidth: 165,
    defaultHeight: 64,
    shortHint:
      "Abgerundetes Rechteck für einen konkreten Arbeitsschritt (z. B. „Zahlung prüfen“)",
    meaning:
      "Eine Aktion ist ein einzelner, ausführbarer Arbeitsschritt innerhalb einer Aktivität. Sie wird als abgerundetes Rechteck mit einer aktiven Verb-Formulierung dargestellt.",
  },
  "decision-merge": {
    kind: "decision-merge",
    label: "Entscheidung / Zusammenführung",
    umlTerm: "Decision / Merge Node",
    diagramTypes: ["activity", "interaction-overview"],
    defaultWidth: 68,
    defaultHeight: 68,
    shortHint:
      "Raute (◇): Verzweigt den Ablauf anhand von [Bedingungen] oder führt Pfade zusammen",
    meaning:
      "Eine Raute mit einer eingehenden und mehreren ausgehenden Kanten ist eine Entscheidung (Decision): Jede ausgehende Kante braucht eine Wächterbedingung in eckigen Klammern wie `[Lagerbestand > 0]`. Mit mehreren eingehenden und einer ausgehenden Kante führt sie alternative Pfade wieder zusammen (Merge).",
  },
  "fork-join": {
    kind: "fork-join",
    label: "Parallelisierung (Fork / Join)",
    umlTerm: "Fork / Join Node",
    diagramTypes: ["activity"],
    defaultWidth: 140,
    defaultHeight: 16,
    shortHint:
      "Starker Balken (▬): Startet parallele Abläufe (Fork) oder synchronisiert sie (Join)",
    meaning:
      "Ein dicker schwarzer Balken: Als Fork spaltet er einen Ablauf in mehrere gleichzeitig (nebenläufig) ablaufende Pfade auf. Als Join wartet er, bis ALLE eingehenden parallelen Pfade fertig sind, bevor es weitergeht.",
  },
  "object-node": {
    kind: "object-node",
    label: "Objektknoten",
    umlTerm: "Object Node",
    diagramTypes: ["activity"],
    defaultWidth: 145,
    defaultHeight: 56,
    shortHint:
      "Kantiges Rechteck für Daten/Dokumente, die zwischen Aktionen fließen",
    meaning:
      "Im Gegensatz zur abgerundeten Aktion ist ein Objektknoten ein scharfkantiges Rechteck: Er zeigt Daten oder physische Dinge (z. B. `Rechnung [bezahlt]`), die von einer Aktion erzeugt und von einer anderen verarbeitet werden.",
  },
  swimlane: {
    kind: "swimlane",
    label: "Schwimmbahn (Partition)",
    umlTerm: "Activity Partition",
    diagramTypes: ["activity"],
    defaultWidth: 260,
    defaultHeight: 360,
    isContainer: true,
    shortHint:
      "Spalte/Bereich, der zeigt, WER für die darin liegenden Aktionen verantwortlich ist",
    meaning:
      "Eine Aktivitätspartition (Swimlane) gliedert die Schritte eines Prozesses nach Verantwortlichkeiten (z. B. `Kunde`, `Onlineshop`, `Versandlager`).",
  },
  "initial-state": {
    kind: "initial-state",
    label: "Startzustand",
    umlTerm: "Initial Pseudostate",
    diagramTypes: ["state-machine"],
    defaultWidth: 36,
    defaultHeight: 36,
    shortHint:
      "Ausgefüllter Punkt (●), der auf den ersten echten Zustand zeigt",
    meaning:
      "Der Start-Pseudozustand markiert, in welchem Zustand der Lebenszyklus eines Objekts direkt nach seiner Erzeugung beginnt.",
  },
  state: {
    kind: "state",
    label: "Zustand",
    umlTerm: "State",
    diagramTypes: ["state-machine", "timing"],
    defaultWidth: 175,
    defaultHeight: 96,
    shortHint:
      "Abgerundetes Rechteck (optional mit entry / do / exit Verhalten)",
    meaning:
      "Ein Zustand beschreibt eine Phase im Leben eines Objekts (z. B. `Reserviert`, `In Zustellung`), in der es auf bestimmte Ereignisse wartet oder eine Aktivität ausführt (`entry /`, `do /`, `exit /`).",
  },
  "final-state": {
    kind: "final-state",
    label: "Endzustand",
    umlTerm: "Final State",
    diagramTypes: ["state-machine"],
    defaultWidth: 40,
    defaultHeight: 40,
    shortHint:
      "Bullauge (◉): Der Lebenszyklus des Objekts ist hier abgeschlossen",
    meaning:
      "Erreicht das Objekt den Endzustand (Bullauge), ist sein Zustandsautomat beendet – es finden keine weiteren Zustandsübergänge mehr statt.",
  },
  "choice-pseudostate": {
    kind: "choice-pseudostate",
    label: "Entscheidungs-Pseudozustand",
    umlTerm: "Choice Pseudostate",
    diagramTypes: ["state-machine"],
    defaultWidth: 60,
    defaultHeight: 60,
    shortHint:
      "Raute (◇) im Zustandsdiagramm für dynamische Verzweigungen per [Guard]",
    meaning:
      "Wählt während einer Transition anhand von Wächterbedingungen `[...]` dynamisch aus, in welchen Zielzustand gewechselt wird.",
  },
  lifeline: {
    kind: "lifeline",
    label: "Lebenslinie (Teilnehmer)",
    umlTerm: "Lifeline",
    diagramTypes: ["sequence", "timing"],
    defaultWidth: 140,
    defaultHeight: 320,
    shortHint:
      "Kopfbox `:Komponente` mit gestrichelter vertikaler Zeitlinie nach unten",
    meaning:
      "Eine Lebenslinie repräsentiert einen einzelnen Interaktionsteilnehmer (z. B. `:Warenkorb` oder `:Zahlungsdienst`). Die Zeit läuft entlang der gestrichelten Linie von oben nach unten.",
  },
  "actor-lifeline": {
    kind: "actor-lifeline",
    label: "Akteur-Lebenslinie",
    umlTerm: "Actor Lifeline",
    diagramTypes: ["sequence"],
    defaultWidth: 120,
    defaultHeight: 320,
    shortHint:
      "Menschlicher oder externer Akteur mit eigener zeitlicher Lebenslinie",
    meaning:
      "Stellt den auslösenden Nutzer oder externen Partner am linken Rand eines Sequenzdiagramms mit einer vertikalen Zeitachse dar.",
  },
  "combined-fragment": {
    kind: "combined-fragment",
    label: "Kombiniertes Fragment",
    umlTerm: "Combined Fragment (alt / loop / opt)",
    diagramTypes: ["sequence", "interaction-overview"],
    defaultWidth: 380,
    defaultHeight: 160,
    isContainer: true,
    shortHint:
      "Rahmen mit Operator `alt`, `opt`, `loop` oder `par` für Bedingungen & Schleifen",
    meaning:
      "Rahmt Nachrichten im Sequenzdiagramm ein, die nur unter einer Bedingung (`opt` / `alt [Bedingung]`), wiederholt (`loop`) oder parallel (`par`) ausgeführt werden.",
  },
  component: {
    kind: "component",
    label: "Komponente",
    umlTerm: "Component («component»)",
    diagramTypes: ["component", "deployment", "composite-structure", "package"],
    defaultWidth: 195,
    defaultHeight: 96,
    defaultStereotype: "component",
    shortHint:
      "Austauschbarer Systembaustein mit «component» und Komponenten-Symbol",
    meaning:
      "Eine Komponente ist ein gekapselter, austauschbarer Teil eines Systems (z. B. `AuthService`, `RechnungsModul`), der nach außen nur über klar definierte Schnittstellen kommuniziert.",
  },
  "provided-interface": {
    kind: "provided-interface",
    label: "Angebotene Schnittstelle (Lollipop)",
    umlTerm: "Provided Interface",
    diagramTypes: ["component"],
    defaultWidth: 120,
    defaultHeight: 54,
    shortHint:
      "Geschlossener Kreis am Stiel (○—): Diese Schnittstelle stellt die Komponente bereit",
    meaning:
      "Die Lollipop-Notation (Kreis) zeigt auf einen Blick: Diese Komponente BIETET diese Schnittstelle an und erfüllt ihren Vertrag.",
  },
  "required-interface": {
    kind: "required-interface",
    label: "Benötigte Schnittstelle (Socket)",
    umlTerm: "Required Interface",
    diagramTypes: ["component"],
    defaultWidth: 120,
    defaultHeight: 54,
    shortHint:
      "Halbkreis-Greifer ()—): Diese Schnittstelle benötigt die Komponente von außen",
    meaning:
      "Die Socket-Notation (offene Schale) zeigt: Diese Komponente BENÖTIGT einen Partner, der die passende Schnittstelle anbietet.",
  },
  port: {
    kind: "port",
    label: "Port",
    umlTerm: "Port",
    diagramTypes: ["component", "composite-structure"],
    defaultWidth: 44,
    defaultHeight: 44,
    shortHint:
      "Kleines Quadrat als dedizierter Interaktionspunkt einer Komponente",
    meaning:
      "Ein Port bündelt einen benannten Ein-/Ausgangspunkt am Rand einer Komponente (z. B. `https:443` oder `eventBus`).",
  },
  "deployment-node": {
    kind: "deployment-node",
    label: "Laufzeit-Knoten (Node)",
    umlTerm: "Deployment Node",
    diagramTypes: ["deployment"],
    defaultWidth: 220,
    defaultHeight: 130,
    isContainer: true,
    defaultStereotype: "device",
    shortHint: "3D-Box für physische Geräte, Server oder Laufzeitumgebungen",
    meaning:
      "Repräsentiert eine physische Hardware (`«device»`) oder Software-Laufzeitumgebung (`«executionEnvironment»` wie Docker/JVM), auf der Komponenten laufen.",
  },
  note: {
    kind: "note",
    label: "Notiz / Kommentar",
    umlTerm: "Comment (Note)",
    diagramTypes: [
      "use-case",
      "class",
      "activity",
      "state-machine",
      "sequence",
      "component",
      "package",
      "object",
      "deployment",
      "composite-structure",
      "communication",
      "interaction-overview",
      "timing",
      "profile",
    ],
    defaultWidth: 170,
    defaultHeight: 76,
    shortHint:
      "Blatt mit Eselsohr für wichtige Randbedingungen oder Erklärungen",
    meaning:
      "Eine UML-Notiz (Rechteck mit umgeknickter Ecke oben rechts) erlaubt dir, wichtige Gedanken, Invarianten oder Warum-Erklärungen direkt an jedes beliebige Element zu heften.",
  },
};

export const UML_EDGE_KINDS: Record<UmlEdgeKind, UmlEdgeKindMeta> = {
  association: {
    kind: "association",
    label: "Assoziation",
    umlTerm: "Association",
    diagramTypes: ["use-case", "class", "object", "deployment"],
    lineStyle: "solid",
    sourceMarker: "none",
    targetMarker: "none",
    shortHint:
      "Durchgezogene Linie (──): Allgemeine Beziehung oder Kommunikation",
    meaning:
      "Drückt aus, dass zwei Elemente miteinander in Verbindung stehen (z. B. ein Akteur kommuniziert mit einem Anwendungsfall, oder zwei Klassen kennen einander). An den Enden können Multiplizitäten (`1`, `0..*`) stehen.",
    directionRule: "Ungerichtet – verbindet beide Partner gleichberechtigt.",
  },
  "directed-association": {
    kind: "directed-association",
    label: "Gerichtete Assoziation",
    umlTerm: "Directed Association (Navigable)",
    diagramTypes: ["class", "object", "component", "communication"],
    lineStyle: "solid",
    sourceMarker: "none",
    targetMarker: "open-arrow",
    shortHint:
      "Durchgezogene Linie mit offener Pfeilspitze (──> ): A kennt/navigiert zu B",
    meaning:
      "Zeigt Navigierbarkeit: Die Quellklasse hält eine Referenz auf die Zielklasse (A kennt B), aber B muss A nicht zwingend kennen.",
    directionRule:
      "Vom Wissenden (Quelle) zum Referenzierten (Ziel mit offener Pfeilspitze).",
  },
  aggregation: {
    kind: "aggregation",
    label: "Aggregation (Teil-Ganzes, lose)",
    umlTerm: "Shared Aggregation",
    diagramTypes: ["class"],
    lineStyle: "solid",
    sourceMarker: "hollow-diamond",
    targetMarker: "none",
    shortHint:
      "Leere Raute (◇──) am Ganzen: Das Teil kann auch ohne das Ganze existieren",
    meaning:
      "Eine „hat-ein“-Beziehung (Teil-Ganzes), bei der die Teile eigenständig weiterleben, wenn das Ganze aufgelöst wird (z. B. `Verein` ◇── `Mitglied` oder `Playlist` ◇── `Song`).",
    directionRule:
      "WICHTIG: Die leere Raute ◇ sitzt immer am GANZEN (Quelle), die Linie führt zum TEIL (Ziel)!",
  },
  composition: {
    kind: "composition",
    label: "Komposition (Existenzabhängig)",
    umlTerm: "Composite Aggregation",
    diagramTypes: ["class"],
    lineStyle: "solid",
    sourceMarker: "filled-diamond",
    targetMarker: "none",
    shortHint:
      "Ausgefüllte Raute (◆──) am Ganzen: Stirbt das Ganze, stirbt auch das Teil",
    meaning:
      "Starke Teil-Ganzes-Beziehung mit exklusiver Existenzabhängigkeit: Ein Teil gehört zu höchstens einem Ganzen und wird zusammen mit ihm gelöscht (z. B. `Haus` ◆── `Raum` oder `Bestellung` ◆── `Bestellposition`).",
    directionRule:
      "WICHTIG: Die ausgefüllte schwarze Raute ◆ sitzt immer am GANZEN (Quelle), die Linie führt zum existenzabhängigen TEIL (Ziel)!",
  },
  generalization: {
    kind: "generalization",
    label: "Vererbung / Generalisierung",
    umlTerm: "Generalization",
    diagramTypes: ["class", "use-case", "profile"],
    lineStyle: "solid",
    sourceMarker: "none",
    targetMarker: "hollow-triangle",
    shortHint:
      "Durchgezogene Linie mit hohler Dreiecksspitze (──▷): „ist-ein“-Beziehung",
    meaning:
      "Drückt Vererbung („ist eine Spezialisierung von“) aus: Die spezifische Unterklasse (z. B. `Elektroauto`) erbt alle Eigenschaften und Operationen der allgemeinen Oberklasse (z. B. `Fahrzeug`).",
    directionRule:
      "Vom Speziellen (Unterklasse) hin zum Allgemeinen (Oberklasse, dort sitzt das hohle Dreieck ▷).",
  },
  realization: {
    kind: "realization",
    label: "Schnittstellen-Realisierung",
    umlTerm: "Interface Realization",
    diagramTypes: ["class", "component"],
    lineStyle: "dashed",
    sourceMarker: "none",
    targetMarker: "hollow-triangle",
    shortHint:
      "Gestrichelte Linie mit hohler Dreiecksspitze (- - ▷): Klasse setzt «interface» um",
    meaning:
      "Zeigt, dass eine Klasse oder Komponente den Vertrag einer Schnittstelle (`«interface»`) tatsächlich implementiert.",
    directionRule:
      "Von der implementierenden Klasse/Komponente hin zum «interface» (dort sitzt das hohle Dreieck ▷).",
  },
  dependency: {
    kind: "dependency",
    label: "Abhängigkeit (Dependency)",
    umlTerm: "Dependency",
    diagramTypes: ["class", "component", "package", "deployment", "profile"],
    lineStyle: "dashed",
    sourceMarker: "none",
    targetMarker: "open-arrow",
    shortHint:
      "Gestrichelte Linie mit offener Pfeilspitze (- - >): „benutzt kurzzeitig“",
    meaning:
      "Schwächste Strukturbeziehung: Element A nutzt Element B (z. B. als Methodenparameter), sodass eine Änderung an B auch Anpassungen an A erfordern kann.",
    directionRule:
      "Vom Abhängigen (Nutzer) hin zum Benötigten (mit offener Pfeilspitze).",
  },
  include: {
    kind: "include",
    label: "«include» (Pflicht-Einbindung)",
    umlTerm: "Include",
    diagramTypes: ["use-case"],
    lineStyle: "dashed",
    sourceMarker: "none",
    targetMarker: "open-arrow",
    fixedStereotype: "include",
    shortHint:
      "Gestrichelter Pfeil mit «include»: Haupt-Use-Case ruft Teil-Use-Case IMMER mit auf",
    meaning:
      "Ein Anwendungsfall bindet einen gemeinsamen Teilschritt zwingend jedes Mal mit ein (z. B. „Überweisung tätigen“ ──«include»──> „PIN prüfen“).",
    directionRule:
      "Vom Haupt-Anwendungsfall (Basis) hin zum immer eingebundenen Teil-Anwendungsfall!",
  },
  extend: {
    kind: "extend",
    label: "«extend» (Optionale Erweiterung)",
    umlTerm: "Extend",
    diagramTypes: ["use-case"],
    lineStyle: "dashed",
    sourceMarker: "none",
    targetMarker: "open-arrow",
    fixedStereotype: "extend",
    shortHint:
      "Gestrichelter Pfeil mit «extend»: Optionaler Zusatz zeigt zum Haupt-Use-Case",
    meaning:
      "Ein optionales Zusatzverhalten klinkt sich unter bestimmten Bedingungen in einen Basis-Anwendungsfall ein (z. B. „Rabattcode einlösen“ ──«extend»──> „Bestellung aufgeben“).",
    directionRule:
      "ACHTUNG Klassiker: Vom OPTIONALEN Erweiterungs-Use-Case hin zum Basis-Use-Case (also genau umgekehrt zu «include»!).",
  },
  "control-flow": {
    kind: "control-flow",
    label: "Kontrollfluss / Objektfluss",
    umlTerm: "Control Flow",
    diagramTypes: ["activity", "interaction-overview"],
    lineStyle: "solid",
    sourceMarker: "none",
    targetMarker: "open-arrow",
    shortHint:
      "Gerichteter Pfeil (──>) zwischen Aktionen, optional mit [Wächterbedingung]",
    meaning:
      "Leitet den Ablauf nach Abschluss einer Aktion zum nächsten Schritt weiter. Nach einer Entscheidungsraute steht eine Bedingung in eckigen Klammern daran, z. B. `[Zahlung erfolgreich]`.",
    directionRule:
      "In zeitlicher Ablaufrichtung vom Vorgänger- zum Nachfolgeschritt.",
  },
  transition: {
    kind: "transition",
    label: "Zustandsübergang (Transition)",
    umlTerm: "Transition",
    diagramTypes: ["state-machine", "timing"],
    lineStyle: "solid",
    sourceMarker: "none",
    targetMarker: "open-arrow",
    shortHint: "Pfeil zwischen Zuständen mit `Ereignis [Bedingung] / Aktion`",
    meaning:
      "Beschreibt den Wechsel von einem Quellzustand in einen Zielzustand, ausgelöst durch ein Ereignis (Trigger), optional geschützt durch eine Wächterbedingung `[Guard]` und begleitet von einem Effekt `/ Aktion`.",
    directionRule: "Vom bisherigen Zustand zum neuen Zustand.",
  },
  "sync-message": {
    kind: "sync-message",
    label: "Synchrone Nachricht (Aufruf)",
    umlTerm: "Synchronous Message",
    diagramTypes: ["sequence", "communication"],
    lineStyle: "solid",
    sourceMarker: "none",
    targetMarker: "filled-triangle",
    shortHint:
      "Durchgezogene Linie mit AUSGEFÜLLTER Pfeilspitze (──▶): Sender wartet auf Antwort",
    meaning:
      "Der Sender ruft eine Operation beim Empfänger auf und wartet blockierend, bis die Verarbeitung abgeschlossen ist und die Antwort zurückkommt.",
    directionRule:
      "Von der aufrufenden Lebenslinie zur angerufenen Lebenslinie.",
  },
  "async-message": {
    kind: "async-message",
    label: "Asynchrone Nachricht (Signal)",
    umlTerm: "Asynchronous Message",
    diagramTypes: ["sequence", "timing"],
    lineStyle: "solid",
    sourceMarker: "none",
    targetMarker: "open-arrow",
    shortHint:
      "Durchgezogene Linie mit OFFENER Pfeilspitze (──>): Sender arbeitet sofort weiter",
    meaning:
      "Der Sender schickt ein Ereignis oder eine Nachricht ab, ohne auf eine direkte Antwort zu warten (Fire-and-Forget / Event).",
    directionRule: "Vom Sender zum Empfänger.",
  },
  "return-message": {
    kind: "return-message",
    label: "Antwortnachricht (Return)",
    umlTerm: "Reply / Return Message",
    diagramTypes: ["sequence"],
    lineStyle: "dashed",
    sourceMarker: "none",
    targetMarker: "open-arrow",
    shortHint:
      "Gestrichelte Linie mit offener Pfeilspitze (- - >): Rückgabewert an den Aufrufer",
    meaning:
      "Liefert das Ergebnis eines synchronen Aufrufs an die wartende Lebenslinie zurück.",
    directionRule:
      "Vom aufgerufenen Dienst zurück zum ursprünglichen Aufrufer.",
  },
  "assembly-connector": {
    kind: "assembly-connector",
    label: "Schnittstellen-Kopplung (Assembly)",
    umlTerm: "Assembly Connector",
    diagramTypes: ["component", "composite-structure"],
    lineStyle: "solid",
    sourceMarker: "socket",
    targetMarker: "lollipop",
    shortHint:
      "Verbindet eine benötigte Schnittstelle (Socket) mit einer angebotenen (Lollipop)",
    meaning:
      "Verdrahtet zwei Komponenten so, dass der Schnittstellenbedarf der einen durch das Schnittstellenangebot der anderen erfüllt wird.",
    directionRule:
      "Vom Konsumenten (benötigend) zum Anbieter (bereitstellend).",
  },
  "note-link": {
    kind: "note-link",
    label: "Notiz-Anbindung",
    umlTerm: "Comment Link",
    diagramTypes: [
      "use-case",
      "class",
      "activity",
      "state-machine",
      "sequence",
      "component",
      "package",
      "object",
      "deployment",
      "composite-structure",
      "communication",
      "interaction-overview",
      "timing",
      "profile",
    ],
    lineStyle: "dashed",
    sourceMarker: "none",
    targetMarker: "none",
    shortHint:
      "Gestrichelte Linie ohne Pfeilspitze zwischen Notiz und Modellelement",
    meaning: "Ordnet einen Kommentar (Notiz) genau dem erklärten Element zu.",
    directionRule: "Zwischen Notiz und beliebigem Element.",
  },
};

let idCounter = 1;
export function createUmlId(prefix = "uml"): string {
  const randomPart = Math.random().toString(36).substring(2, 7);
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}_${randomPart}`;
}

import {
  type AppLocale,
  EN_DIAGRAM_TYPE_META,
  EN_EDGE_KIND_META,
  EN_NODE_KIND_META,
} from "../i18n/translations";

export function getDiagramTypeMeta(
  type: UmlDiagramType,
  locale: AppLocale = "de",
): UmlDiagramTypeMeta {
  const base = UML_DIAGRAM_TYPES[type];
  if (locale === "en") {
    return {
      ...base,
      ...EN_DIAGRAM_TYPE_META[type],
    };
  }
  return base;
}

export function getNodeKindMeta(
  kind: UmlNodeKind,
  locale: AppLocale = "de",
): UmlNodeKindMeta {
  const base = UML_NODE_KINDS[kind];
  if (locale === "en") {
    return {
      ...base,
      label: EN_NODE_KIND_META[kind].label,
      shortHint: EN_NODE_KIND_META[kind].shortHint,
      meaning: EN_NODE_KIND_META[kind].meaning,
    };
  }
  return base;
}

export function getEdgeKindMeta(
  kind: UmlEdgeKind,
  locale: AppLocale = "de",
): UmlEdgeKindMeta {
  const base = UML_EDGE_KINDS[kind];
  if (locale === "en") {
    return {
      ...base,
      label: EN_EDGE_KIND_META[kind].label,
      shortHint: EN_EDGE_KIND_META[kind].shortHint,
      meaning: EN_EDGE_KIND_META[kind].meaning,
      directionRule: EN_EDGE_KIND_META[kind].directionRule,
    };
  }
  return base;
}

export function createDefaultNode(
  kind: UmlNodeKind,
  x: number,
  y: number,
  customName?: string,
  locale: AppLocale = "de",
): UmlNode {
  const meta = UML_NODE_KINDS[kind];
  const id = createUmlId("node");

  const defaultNamesDe: Record<UmlNodeKind, string> = {
    actor: "Kunde",
    "use-case": "Aufgabe ausführen",
    "system-boundary": "Mein System",
    class: "NeueKlasse",
    "abstract-class": "AbstrakteBasis",
    interface: "ISchnittstelle",
    enum: "Status",
    package: "kernmodul",
    object: "exemplar : Klasse",
    "initial-node": "Start",
    "activity-final": "Ende",
    "flow-final": "ZweigEnde",
    action: "Schritt ausführen",
    "decision-merge": "Bedingung?",
    "fork-join": "Parallelisierung",
    "object-node": "Dokument",
    swimlane: "Verantwortungsbereich",
    "initial-state": "Start",
    state: "Bereit",
    "final-state": "Ende",
    "choice-pseudostate": "Prüfung",
    lifeline: ":Dienst",
    "actor-lifeline": "Nutzer",
    "combined-fragment": "Bedingter Block",
    component: "ServiceModul",
    "provided-interface": "API",
    "required-interface": "DatenbankAPI",
    port: "httpPort",
    "deployment-node": "AppServer",
    note: "Wichtiger Hinweis zur Idee...",
  };

  const defaultName =
    locale === "en"
      ? EN_NODE_KIND_META[kind].defaultName
      : defaultNamesDe[kind];

  const defaultAttributes: UmlAttribute[] =
    kind === "class"
      ? [
          {
            id: createUmlId("attr"),
            visibility: "-",
            name: "id",
            type: "String",
          },
          {
            id: createUmlId("attr"),
            visibility: "-",
            name: locale === "en" ? "title" : "bezeichnung",
            type: "String",
          },
        ]
      : kind === "enum"
        ? [
            {
              id: createUmlId("attr"),
              visibility: "+",
              name: locale === "en" ? "DRAFT" : "ENTWURF",
              type: "",
            },
            {
              id: createUmlId("attr"),
              visibility: "+",
              name: locale === "en" ? "ACTIVE" : "AKTIV",
              type: "",
            },
          ]
        : kind === "object"
          ? [
              {
                id: createUmlId("attr"),
                visibility: "+",
                name: "status",
                type: locale === "en" ? '"active"' : '"aktiv"',
              },
            ]
          : [];

  const defaultOperations: UmlOperation[] =
    kind === "class" || kind === "abstract-class" || kind === "interface"
      ? [
          {
            id: createUmlId("op"),
            visibility: "+",
            name: locale === "en" ? "process" : "verarbeite",
            parameters: "",
            returnType: "boolean",
            isAbstract: kind === "interface" || kind === "abstract-class",
          },
        ]
      : [];

  return {
    id,
    kind,
    name: customName ?? defaultName,
    stereotype: meta.defaultStereotype,
    x: Math.round(x),
    y: Math.round(y),
    width: meta.defaultWidth,
    height: meta.defaultHeight,
    isAbstract: kind === "abstract-class" || kind === "interface",
    attributes: defaultAttributes,
    operations: defaultOperations,
    stateActivities:
      kind === "state"
        ? {
            entry: locale === "en" ? "initialize()" : "initialisiere()",
            doActivity:
              locale === "en" ? "waitForInput()" : "warteAufEingabe()",
          }
        : undefined,
    fragmentOperator: kind === "combined-fragment" ? "alt" : undefined,
    fragmentGuard:
      kind === "combined-fragment"
        ? locale === "en"
          ? "condition met"
          : "Bedingung erfüllt"
        : undefined,
  };
}

export function createDefaultEdge(
  kind: UmlEdgeKind,
  sourceId: string,
  targetId: string,
  label?: string,
  locale: AppLocale = "de",
): UmlEdge {
  const meta = UML_EDGE_KINDS[kind];
  return {
    id: createUmlId("edge"),
    kind,
    sourceId,
    targetId,
    stereotype: meta.fixedStereotype,
    label:
      label ??
      (kind === "sync-message"
        ? locale === "en"
          ? "sendRequest()"
          : "anfrageSenden()"
        : kind === "async-message"
          ? locale === "en"
            ? "notifyEvent()"
            : "ereignisMelden()"
          : kind === "return-message"
            ? locale === "en"
              ? "result"
              : "ergebnis"
            : kind === "transition"
              ? locale === "en"
                ? "event [guard] / action()"
                : "ereignis [Bedingung] / aktion()"
              : ""),
    sourceMultiplicity:
      kind === "composition" || kind === "aggregation" ? "1" : "",
    targetMultiplicity:
      kind === "composition" ? "1..*" : kind === "aggregation" ? "0..*" : "",
  };
}

export function cloneDiagram(diagram: UmlDiagram): UmlDiagram {
  return JSON.parse(JSON.stringify(diagram)) as UmlDiagram;
}
