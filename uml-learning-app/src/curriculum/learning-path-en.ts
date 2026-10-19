import type { VisualCheckQuestion } from "./learning-path";

export interface LessonLocalization {
  title: string;
  subtitle: string;
  whyItMatters: string;
  explanationHtml: string;
  visualCheck: VisualCheckQuestion;
  taskPrompt: string;
  level2ScenarioPrompt: string;
  celebrationMessage: string;
  criteriaDescriptions: Record<string, { description: string; hint: string }>;
  nodeTranslations?: Record<string, string>;
  edgeLabelTranslations?: Record<string, { label?: string; guard?: string }>;
}

export interface StageLocalization {
  title: string;
  subtitle: string;
  badgeTitle: string;
  expressionSkillSummary: string;
  celebrationHeadline: string;
  celebrationBody: string;
  unlockedElementsSummary: string[];
}

/**
 * German Level 2 pure system descriptions (no UML spoilers — the learner
 * translates the system behavior into UML 2.5.1 on their own).
 */
export const DE_LEVEL2_SCENARIOS: Record<string, string> = {
  "uc-1-boxes":
    "Szenario: Die Verkehrsbetriebe stellen einen neuen „Fahrkartenautomat“ auf. Ein „Fahrgast“ tritt von außen an das Gerät heran, um damit das Ziel „Ticket kaufen“ zu erreichen. Modelliere das System, seine Grenze und die Beteiligten.",
  "uc-2-connections":
    "Szenario: Am „Fahrkartenautomat“ möchte ein „Fahrgast“ ein „Ticket kaufen“. Bei ausnahmslos jedem Ticketkauf muss zwingend der Vorgang „Bezahlen“ durchlaufen werden. Besitzt der Fahrgast eine Rabattkarte, kann er beim Kauf optional „Bahncard-Rabatt nutzen“. Übersetze diesen Sachverhalt vollständig in ein Anwendungsfalldiagramm.",
  "uc-3-detective":
    "Szenario-Prüfung: Im „Online-Banking“ führt ein externer „Bankkunde“ den Vorgang „Überweisung tätigen“ aus. Nur auf besonderen Wunsch lässt er sich dabei optional einen „Spendenbeleg drucken“. Das vorliegende Diagramm widerspricht an zwei Stellen dieser Fachlogik – finde und korrigiere beide Fehler!",
  "uc-4-capstone":
    "Szenario: Ein „SmartLock-System“ sichert die Haustür. Ein „Bewohner“ möchte die „Tür entriegeln“. Jede Entriegelung setzt zwingend voraus, den „Zugangscode prüfen“ zu lassen. Wird mehrfach ein falscher Code eingegeben, kann beim Entriegelungsversuch optional „Alarm auslösen“ eintreten. Modelliere das Gesamtsystem von Grund auf.",

  "cls-1-boxes":
    "Szenario: In einer digitalen Bibliothek soll jedes „Buch“ mindestens mit seinem „titel“ und seiner „isbn“ erfasst werden und prüfen können, ob es verfügbar ist. Außerdem soll ein allgemeiner Vertrag „Ausleihbar“ definiert werden, der vorschreibt, dass ein Medium ausgeliehen werden kann.",
  "cls-2-connections":
    "Szenario: In einem Buchshop besteht jede „Bestellung“ aus mindestens einer „Bestellposition“ – wird die Bestellung gelöscht, existieren auch ihre Positionen nicht mehr. Ein „EBook“ ist eine spezielle Form eines „Buch“s. Jedes „Buch“ erfüllt zudem den Vertrag „Ausleihbar“. Modelliere alle Bausteine und ihre exakten Beziehungen.",
  "cls-3-detective":
    "Szenario-Prüfung: Eine „Flotte“ fasst mehrere „Fahrzeug“-Objekte zusammen; wird die Flotte aufgelöst, bleiben die einzelnen Fahrzeuge jedoch bestehen. Ein „Elektroauto“ ist eine spezielle Art von „Fahrzeug“. Das geladene Diagramm verdreht zwei dieser Aussagen – korrigiere es!",
  "cls-4-capstone":
    "Szenario: Auf einem Online-Kursportal belegen „Teilnehmer“ beliebig viele „Kurs“-Angebote. Jeder „Kurs“ gliedert sich in mehrere „Lektion“-Einheiten, die ohne ihren Kurs nicht existieren können. Eine „VideoLektion“ ist eine spezielle Art von „Lektion“. Entwirf das vollständige Domänenmodell.",

  "act-1-boxes":
    "Szenario: Beschreibe den durchgehenden Ablauf einer Kaffeezubereitung vom Beginn bis zum Abschluss: Zuerst gilt es „Kaffee mahlen“, direkt im Anschluss „Espresso brühen“, woraufhin der Prozess endet.",
  "act-2-connections":
    "Szenario: Nachdem „Bestellung prüfen“ abgeschlossen ist, verzweigt sich der Prozess je nach gewählter Versandart: Entweder wird bei Express-Wunsch „Expressversand starten“ ausgeführt, oder im Normalfall „Standardversand starten“. Modelliere den Ablauf inklusive sauberer Entscheidungslogik.",
  "act-3-detective":
    "Szenario-Prüfung: Nach dem Schritt „Bonität prüfen“ entscheidet sich, ob „Kredit genehmigen“ (bei ausreichender Bonität) oder „Antrag ablehnen“ (andernfalls) ausgeführt wird. Im Diagramm fehlt die Information, wann welcher Pfad eingeschlagen wird – vervollständige das Modell!",
  "act-4-capstone":
    "Szenario: Sobald der Prozess startet und „Bestellung empfangen“ wurde, laufen im Lager zwei Dinge gleichzeitig an: Während ein Mitarbeiter „Ware verpacken“ übernimmt, wird parallel dazu bereits „Rechnung erstellen“ ausgeführt. Danach endet der Prozess. Modelliere diesen nebenläufigen Ablauf.",

  "stm-1-boxes":
    "Szenario: Ein Redaktionsartikel entsteht neu im Zustand „Entwurf“. Später erreicht er den Zustand „Veröffentlicht“, wobei direkt beim Eintritt in diesen Zustand automatisch eine Benachrichtigung versendet wird. Modelliere den Beginn und diese Lebensphasen.",
  "stm-2-connections":
    "Szenario: Ein Artikel startet als „Entwurf“. Sobald das Ereignis „freigeben“ (unter der Bedingung „geprüft“) eintritt, wechselt er in den Zustand „Veröffentlicht“. Wird er später archiviert, endet sein Lebenszyklus. Modelliere alle Zustände und Übergänge.",
  "stm-3-detective":
    "Szenario-Prüfung: Eine Bestellung ist zunächst „Offen“ und kann entweder „Bezahlt“ oder „Storniert“ werden. Nur eine bezahlte Bestellung darf anschließend in den Zustand „Geliefert“ übergehen. Im vorliegenden Diagramm steckt ein gefährlicher Logikfehler – behebe ihn!",
  "stm-4-capstone":
    "Szenario: Ein Paket-Schließfach einer Packstation ist zu Beginn „Frei“. Legt ein Zusteller ein Paket ein, wechselt das Fach in den Zustand „Belegt“. Modelliere den Lebenszyklus des Schließfachs vom Start über die Zustände und ihre auslösenden Übergänge.",

  "seq-1-boxes":
    "Szenario: Bei einem Online-Bezahlvorgang wirken drei Parteien zeitlich zusammen: der menschliche „Kunde“, das System „:Webshop“ und der externe „:Zahlungsdienst“. Richte die Bühne für deren zeitlichen Nachrichtenaustausch ein.",
  "seq-2-connections":
    "Szenario: Der „:Webshop“ ruft beim „:Zahlungsdienst“ die Abbuchung auf und wartet blockierend, bis dieser das Ergebnis zurückmeldet. Anschließend stößt der „:Webshop“ beim „:E-Mail-Service“ den Versand der Bestätigungsmail an, ohne auf dessen Fertigstellung zu warten. Modelliere die Teilnehmer und alle drei Nachrichten.",
  "seq-3-detective":
    "Szenario-Prüfung: Die „:App“ ruft beim „:AuthServer“ die Passwortprüfung auf und wartet, bis der „:AuthServer“ das Token als Antwort zurückgibt. Im geladenen Diagramm sieht die Rückgabe jedoch wie ein neuer blockierender Aufruf aus – korrigiere die Notation!",
  "seq-4-capstone":
    "Szenario: Ein „Besucher“ sendet seinen Sitzplatzwunsch an den „:BuchungsService“. Dieser ruft blockierend die Platzreservierung bei der „:SaalplanDB“ auf und erhält von ihr eine Antwort zurück. Modelliere das komplette zeitliche Zusammenspiel.",

  "cmp-1-boxes":
    "Szenario: Die Architektur eines Onlineshops umfasst die modularen Systembausteine „BestellService“ und „ZahlungsGateway“ sowie die öffentlich angebotene Schnittstelle „IZahlung“. Modelliere diese Architekturbausteine.",
  "cmp-2-connections":
    "Szenario: Um „BestellService“ und „ZahlungsGateway“ sauber zu entkoppeln, stellt „ZahlungsGateway“ die Schnittstelle „IZahlung“ bereit, während „BestellService“ lediglich von „IZahlung“ abhängt. Modelliere die Komponenten, die Schnittstelle und ihre Verdrahtung.",
  "cmp-3-detective":
    "Szenario-Prüfung: In einer dreischichtigen Architektur nutzt das „WebFrontend“ den „KernService“, und der „KernService“ nutzt den „DatenbankAdapter“. Im vorliegenden Diagramm ist eine Abhängigkeit falsch verbunden – bringe die Architektur in Ordnung!",
  "cmp-4-capstone":
    "Szenario: Entwirf die modulare Architektur einer Musik-Streaming-Plattform bestehend aus „PlayerApp“, „StreamingService“ und „KatalogService“. Kopple die Bausteine über mindestens eine explizite Schnittstelle (z. B. „AudioStreamAPI“) und saubere Abhängigkeiten.",
};

export const EN_STAGES: Record<string, StageLocalization> = {
  "stage-1-use-case": {
    title: "Stage 1: Scope Ideas & Show User Value",
    subtitle: "The Use Case Diagram",
    badgeTitle: "System Boundary Pioneer",
    expressionSkillSummary:
      "You can immediately clarify on a napkin or in a meeting what belongs inside a system, who interacts with it, and what concrete value it delivers.",
    celebrationHeadline:
      "Stage 1 Mastered: You command the outside-in perspective!",
    celebrationBody:
      "Describing a system starts not with database tables, but with the boundary between the world and your system. You can now express Actors, System Boundaries, Use Cases, «include», and «extend» with crystal clarity!",
    unlockedElementsSummary: [
      "Actor (stick figure outside the system)",
      "System Boundary (rectangular subject frame)",
      "Use Case (ellipse representing a user goal)",
      "Association, «include» (mandatory sub-step) & «extend» (optional extension)",
    ],
  },
  "stage-2-class": {
    title: "Stage 2: Sharpen Domain Concepts & Structure",
    subtitle: "The Class Diagram",
    badgeTitle: "Domain Architect",
    expressionSkillSummary:
      "You can unambiguously model the core concepts of any domain, their attributes, interfaces, inheritance, and part-whole relationships.",
    celebrationHeadline:
      "Stage 2 Mastered: Your structural models speak UML 2.5.1!",
    celebrationBody:
      "You master classes with visibilities (+, -, #), interfaces («interface»), multiplicities, and the crucial distinction between Aggregation (◇) and Composition (◆)!",
    unlockedElementsSummary: [
      "Class (3 compartments: Name, Attributes, Operations) & Visibilities (+, -, #, ~)",
      "Interface («interface») & Abstract Class",
      "Aggregation (hollow diamond ◇) vs. Composition (filled diamond ◆)",
      "Generalization / Inheritance (──▷) & Realization (- - ▷)",
    ],
  },
  "stage-3-activity": {
    title: "Stage 3: Think Through Workflows & Decisions",
    subtitle: "The Activity Diagram",
    badgeTitle: "Flow Master",
    expressionSkillSummary:
      "You can seamlessly visualize complex business processes, conditional branches, and concurrent parallel steps.",
    celebrationHeadline:
      "Stage 3 Mastered: No workflow can hide its logic from you!",
    celebrationBody:
      "With initial nodes, actions, decision diamonds with [Guards], and synchronization bars (Fork/Join), you bring clarity to any process!",
    unlockedElementsSummary: [
      "Initial Node (●) & Activity Final Node (◉ bullseye)",
      "Action (rounded rectangle) & Object Node (sharp rectangle)",
      "Decision / Merge Diamond (◇) with [Guard] conditions",
      "Concurrency & Synchronization (Fork/Join Bar ▬)",
    ],
  },
  "stage-4-state": {
    title: "Stage 4: Master Lifecycles & States",
    subtitle: "The State Machine Diagram",
    badgeTitle: "State Guardian",
    expressionSkillSummary:
      "You can model the behavior of an object across its entire lifetime using clear states, triggering events, guards, and transitions.",
    celebrationHeadline: "Stage 4 Mastered: You think in clean state machines!",
    celebrationBody:
      "Instead of tangled boolean flags, you now model explicit states with entry/do/exit behaviors and precise transitions (`event [guard] / effect`).",
    unlockedElementsSummary: [
      "Initial State (●) & Final State (◉)",
      "State with internal activities (`entry /`, `do /`, `exit /`)",
      "Transition labeled `event [guard] / effect`",
      "Choice Pseudostate (◇)",
    ],
  },
  "stage-5-sequence": {
    title: "Stage 5: Make Interactions Over Time Visible",
    subtitle: "The Sequence Diagram",
    badgeTitle: "Interaction Conductor",
    expressionSkillSummary:
      "Like a musical score, you can show which service sends which message to whom and whether it blocks waiting for a reply or fires asynchronously.",
    celebrationHeadline: "Stage 5 Mastered: You conduct complex interactions!",
    celebrationBody:
      "Lifelines, synchronous calls (──▶), asynchronous signals (──>), dashed return messages (- - >), and combined fragments (`alt`, `loop`, `opt`) are now part of your active vocabulary!",
    unlockedElementsSummary: [
      "Lifeline (`:Service`) & Actor Lifeline with vertical timeline",
      "Synchronous Message (──▶ filled triangle) vs. Asynchronous Message (──> open arrow)",
      "Return Message (- - > dashed reply arrow)",
      "Combined Fragment (`alt`, `opt`, `loop`, `par`)",
    ],
  },
  "stage-6-component": {
    title: "Stage 6: Slice Large Systems Modularly",
    subtitle: "The Component Diagram",
    badgeTitle: "Systems Architect",
    expressionSkillSummary:
      "You can structure entire software landscapes into replaceable components with provided (Lollipop) and required (Socket) interfaces.",
    celebrationHeadline:
      "All 6 Stages Completed: You are a Certified UML 2.5.1 Systems Architect!",
    celebrationBody:
      "You completed the entire learning path! From initial user value (Use Case) through structure (Classes & Components) to behavior (Activities, States & Sequences), you can visually express any system.",
    unlockedElementsSummary: [
      "Component («component») with official classifier icon",
      "Provided Interface (Lollipop ○—) & Required Interface (Socket )—)",
      "Assembly Connector & Dependency (- - >)",
      "Package («package») for architectural layering",
    ],
  },
};

export const EN_LESSONS: Record<string, LessonLocalization> = {
  "uc-1-boxes": {
    title: "1.1 Inside vs. Outside: System Boundary, Actor & Use Case",
    subtitle: "The three core building blocks of every Use Case diagram",
    whyItMatters:
      "The most common cause of misunderstandings in projects is ambiguity about where the system ends and who actually interacts with it.",
    explanationHtml: `
      <p>A <strong>Use Case Diagram</strong> answers two fundamental questions at a glance:</p>
      <ul>
        <li><strong>System Boundary (rectangular frame):</strong> Draws a clear wall around your system. Everything <em>inside</em> the frame is what we build.</li>
        <li><strong>Actor (stick figure):</strong> A role outside the system (a human like <code>Passenger</code> or an external system like <code>BankServer</code>). <strong>Golden Rule:</strong> Actors always stand <em>outside</em> the system boundary!</li>
        <li><strong>Use Case (ellipse):</strong> A concrete goal from the actor's perspective, phrased as <em>Verb + Noun</em> (e.g. <code>Buy Ticket</code>). It sits <em>inside</em> the system boundary.</li>
      </ul>
    `,
    visualCheck: {
      question:
        "Where must an Actor (e.g. 'Passenger') be placed in a valid UML 2.5.1 Use Case diagram?",
      options: [
        "Inside the system boundary next to the use cases",
        "Always outside the system boundary, since the actor is not part of the built system",
        "Inside a class compartment as a private attribute",
      ],
      correctIndex: 1,
      explanation:
        "Exactly! The system boundary encloses only the system's use cases. Actors interact with the system from the outside.",
    },
    taskPrompt:
      "Place a System Boundary (e.g. 'Ticket Machine'), create an Actor 'Passenger' outside it, and place the Use Case 'Buy Ticket' inside the system boundary.",
    level2ScenarioPrompt:
      "Scenario: The transit authority is deploying a 'Ticket Machine'. A 'Passenger' approaches the machine from outside with the goal to 'Buy Ticket'. Model the system boundary and the involved elements.",
    celebrationMessage:
      "Awesome! You cleanly separated Inside (Use Case in the system) and Outside (Actor).",
    nodeTranslations: {
      uc1_boundary: "Ticket Machine",
      uc1_actor: "Passenger",
      uc1_uc: "Buy Ticket",
    },
    criteriaDescriptions: {
      "uc1-boundary": {
        description: "System Boundary (e.g. 'Ticket Machine') is present",
        hint: "Add a System Boundary from the tool palette.",
      },
      "uc1-actor": {
        description:
          "Actor 'Passenger' (or 'Customer') stands outside the system boundary",
        hint: "Place an Actor 'Passenger' to the left, outside the system boundary.",
      },
      "uc1-usecase": {
        description:
          "Use Case 'Buy Ticket' is positioned inside the system boundary",
        hint: "Place a Use Case 'Buy Ticket' inside the System Boundary frame.",
      },
    },
  },

  "uc-2-connections": {
    title: "1.2 Relationships: Association, «include» & «extend»",
    subtitle: "How actors and use cases connect",
    whyItMatters:
      "With «include» and «extend», you express which sub-steps are mandatory every single time and which are optional extras.",
    explanationHtml: `
      <p>Use Case diagrams use three main relationship types:</p>
      <ul>
        <li><strong>Association (solid line <code>──</code>):</strong> Connects an Actor to the Use Case they participate in.</li>
        <li><strong><code>«include»</code> (dashed arrow <code>- - &gt;</code>):</strong> Mandatory inclusion! The arrow points from the <strong>base Use Case to the always-executed sub-Use-Case</strong> (e.g. <code>Buy Ticket ──«include»──&gt; Pay</code>).</li>
        <li><strong><code>«extend»</code> (dashed arrow <code>- - &gt;</code>):</strong> Optional extension! <em>Watch the arrow direction:</em> The arrow points from the <strong>optional extension toward the base Use Case</strong> (e.g. <code>Use Railcard Discount ──«extend»──&gt; Buy Ticket</code>).</li>
      </ul>
    `,
    visualCheck: {
      question:
        "Whenever 'Buy Ticket' runs, 'Pay' is executed EVERY SINGLE TIME. Which arrow is correct in UML 2.5.1?",
      options: [
        "An «extend» arrow from 'Buy Ticket' to 'Pay'",
        "An inheritance arrow from 'Pay' to 'Buy Ticket'",
        "An «include» arrow pointing from 'Buy Ticket' to 'Pay'",
      ],
      correctIndex: 2,
      explanation:
        "Correct! For «include», the arrow points from the base use case ('Buy Ticket') to the mandatory included step ('Pay').",
    },
    taskPrompt:
      "1. Connect 'Passenger' via Association to 'Buy Ticket'. 2. Draw an «include» arrow from 'Buy Ticket' to 'Pay'. 3. Draw an «extend» arrow from 'Use Railcard Discount' to 'Buy Ticket'.",
    level2ScenarioPrompt:
      "Scenario: At a 'Ticket Machine', a 'Passenger' wants to 'Buy Ticket'. Every ticket purchase mandatorily requires the step 'Pay'. If the passenger owns a discount card, they may optionally 'Use Railcard Discount' during the purchase. Model the complete Use Case diagram.",
    celebrationMessage:
      "Spot on! You now master the crucial directional difference between «include» and «extend».",
    nodeTranslations: {
      uc2_boundary: "Ticket Machine",
      uc2_actor: "Passenger",
      uc2_main: "Buy Ticket",
      uc2_pay: "Pay",
      uc2_discount: "Use Railcard Discount",
    },
    criteriaDescriptions: {
      "uc2-assoc": {
        description: "Association between 'Passenger' and 'Buy Ticket'",
        hint: "Select 'Association' and draw a line between 'Passenger' and 'Buy Ticket'.",
      },
      "uc2-include": {
        description: "«include» arrow points from 'Buy Ticket' to 'Pay'",
        hint: "Select '«include»' and draw the arrow from 'Buy Ticket' to 'Pay'.",
      },
      "uc2-extend": {
        description:
          "«extend» arrow points from 'Use Railcard Discount' to 'Buy Ticket'",
        hint: "Select '«extend»' and draw the arrow from the optional 'Use Railcard Discount' to the base use case 'Buy Ticket'.",
      },
    },
  },

  "uc-3-detective": {
    title: "1.3 Bug Detective: The Mixed-Up Online Banking",
    subtitle: "Find and fix two classic Use Case modeling mistakes",
    whyItMatters:
      "When you can spot flaws in existing diagrams immediately, you have truly internalized the visual grammar.",
    explanationHtml: `
      <p>A colleague drew a Use Case diagram for an <strong>Online Banking</strong> app — but there are <strong>two classic mistakes</strong> in it:</p>
      <ol>
        <li>The Actor <code>Bank Customer</code> was accidentally placed <strong>inside the system boundary</strong>.</li>
        <li>The <code>«extend»</code> arrow between <code>Make Transfer</code> and the optional <code>Print Donation Receipt</code> points in the <strong>wrong direction</strong>! (Remember: The optional extending use case points with <code>«extend»</code> toward the base use case).</li>
      </ol>
    `,
    visualCheck: {
      question:
        "If 'Print Donation Receipt' is an optional extension of 'Make Transfer', where must the «extend» arrowhead point?",
      options: [
        "Toward 'Print Donation Receipt'",
        "Toward 'Make Transfer' (the base use case)",
        "Toward the Actor 'Bank Customer'",
      ],
      correctIndex: 1,
      explanation:
        "Exactly: The optional extension ('Print Donation Receipt') references the base case ('Make Transfer') and points to it with «extend»!",
    },
    taskPrompt:
      "Fix the diagram in the editor: 1. Drag the Actor 'Bank Customer' to the left OUTSIDE the system boundary. 2. Click the «extend» arrow and reverse its direction ('Reverse Direction ⇄' in the right inspector).",
    level2ScenarioPrompt:
      "Scenario Audit: In 'Online Banking', an external 'Bank Customer' performs 'Make Transfer'. Only if desired, they can optionally 'Print Donation Receipt'. The loaded diagram contradicts this domain logic in two places — find and fix both mistakes!",
    celebrationMessage:
      "Sharp eye! Both modeling flaws have been cleanly resolved.",
    nodeTranslations: {
      uc3_boundary: "Online Banking",
      uc3_actor: "Bank Customer",
      uc3_transfer: "Make Transfer",
      uc3_receipt: "Print Donation Receipt",
    },
    criteriaDescriptions: {
      "uc3-actor-out": {
        description: "Actor 'Bank Customer' stands outside the system boundary",
        hint: "Drag the stick figure 'Bank Customer' to the left, outside the 'Online Banking' boundary.",
      },
      "uc3-extend-fixed": {
        description:
          "«extend» arrow points from 'Print Donation Receipt' to 'Make Transfer'",
        hint: "Click the «extend» arrow and click 'Reverse Direction ⇄' in the right inspector.",
      },
    },
  },

  "uc-4-capstone": {
    title: "1.4 Stage Finale: The Smart Home Door Lock",
    subtitle: "Your first complete systems thinking mission",
    whyItMatters:
      "Now you prove that you can translate a real product idea into a clear Use Case diagram.",
    explanationHtml: `
      <p><strong>Your Mission:</strong> Model a <strong>Smart Home Door Lock</strong> according to these requirements:</p>
      <ul>
        <li>There is a System Boundary (e.g. <code>SmartLock System</code>).</li>
        <li>An Actor <code>Resident</code> stands outside the system boundary.</li>
        <li>The resident uses the Use Case <code>Unlock Door</code> (inside the system boundary).</li>
        <li>Every <code>Unlock Door</code> mandatorily includes <code>Verify Access Code</code> via <code>«include»</code>.</li>
        <li>Optionally, during unlocking, <code>Trigger Alarm</code> can occur via <code>«extend»</code> (after failed attempts).</li>
      </ul>
    `,
    visualCheck: {
      question:
        "Why do we model 'Verify Access Code' as its own «include» use case instead of hiding it?",
      options: [
        "Because a Use Case diagram must always contain at least 5 ellipses",
        "Because Actors may only connect to «include» arrows",
        "Because this verification step is central and can be reused by other use cases (e.g. 'Change Settings')",
      ],
      correctIndex: 2,
      explanation:
        "Exactly! «include» makes shared mandatory sub-steps explicit and reusable.",
    },
    taskPrompt: "Model the Smart Home Door Lock satisfying all 5 criteria.",
    level2ScenarioPrompt:
      "Scenario: A 'SmartLock System' secures the front door. A 'Resident' wants to 'Unlock Door'. Every unlock mandatorily requires the system to 'Verify Access Code'. If wrong codes are entered repeatedly, unlocking may optionally 'Trigger Alarm'. Model the complete system from scratch.",
    celebrationMessage: "Congratulations on completing Stage 1!",
    nodeTranslations: {
      uc4_boundary: "SmartLock System",
      uc4_actor: "Resident",
      uc4_unlock: "Unlock Door",
      uc4_check: "Verify Access Code",
      uc4_alarm: "Trigger Alarm",
    },
    criteriaDescriptions: {
      "uc4-actor": {
        description:
          "Actor 'Resident' (outside the system boundary) is present",
        hint: "Place an Actor 'Resident' to the left, outside the system boundary.",
      },
      "uc4-unlock": {
        description: "Use Case 'Unlock Door' sits inside the system boundary",
        hint: "Place the Use Case 'Unlock Door' inside the system boundary.",
      },
      "uc4-assoc": {
        description: "Association between 'Resident' and 'Unlock Door'",
        hint: "Connect 'Resident' to 'Unlock Door' with an Association.",
      },
      "uc4-include": {
        description: "«include» from 'Unlock Door' to 'Verify Access Code'",
        hint: "Create the Use Case 'Verify Access Code' and draw an «include» arrow from 'Unlock Door' to it.",
      },
      "uc4-extend": {
        description: "«extend» from 'Trigger Alarm' to 'Unlock Door'",
        hint: "Create the Use Case 'Trigger Alarm' and draw an «extend» arrow from 'Trigger Alarm' to 'Unlock Door'.",
      },
    },
  },

  "cls-1-boxes": {
    title: "2.1 Anatomy of a Class & Interface",
    subtitle: "Three compartments, visibilities (+ / -) and «interface»",
    whyItMatters:
      "When people talk past each other, they often mean different things by the same word. A UML class makes every domain concept concrete.",
    explanationHtml: `
      <p>A <strong>Class</strong> in UML 2.5.1 is a rectangle with three compartments:</p>
      <ol>
        <li><strong>Header:</strong> Singular class name (e.g. <code>Book</code>), optionally with a stereotype like <code>«interface»</code>.</li>
        <li><strong>Attributes (Properties):</strong> Format <code>visibility name : Type</code>, e.g. <code>- title : String</code>. Here <code>-</code> means <em>private</em> (encapsulated) and <code>+</code> means <em>public</em>.</li>
        <li><strong>Operations (Behavior):</strong> Format <code>+ borrow() : boolean</code>.</li>
      </ul>
    `,
    visualCheck: {
      question:
        "What does the minus sign mean in the attribute line '- balance : Euro' of a UML class?",
      options: [
        "The account balance is negative",
        "The attribute is private and encapsulated inside the class",
        "The attribute was deprecated",
      ],
      correctIndex: 1,
      explanation:
        "Correct! `-` stands for `private` (encapsulation), `+` for `public`, `#` for `protected`, and `~` for `package`.",
    },
    taskPrompt:
      "Create a Class 'Book' with at least 2 attributes (e.g. 'title' and 'isbn') and at least 1 operation, plus an Interface 'Borrowable' («interface»).",
    level2ScenarioPrompt:
      "Scenario: In a digital library, every 'Book' must store at least two properties (such as 'title' and 'isbn') and offer an operation to check availability. Additionally, a general contract 'Borrowable' must define that media items can be borrowed. Model these structural building blocks.",
    celebrationMessage:
      "Great job! Your first true UML 2.5.1 classes and interfaces are in place.",
    nodeTranslations: {
      cls1_book: "Book",
      cls1_ifc: "Borrowable",
    },
    criteriaDescriptions: {
      "cls1-book": {
        description: "Class 'Book' with at least 2 attributes and 1 operation",
        hint: "Place a Class named 'Book' and ensure it has at least 2 attributes and 1 operation.",
      },
      "cls1-ifc": {
        description: "Interface 'Borrowable' («interface») is present",
        hint: "Place an Interface («interface») from the palette and name it 'Borrowable'.",
      },
    },
  },

  "cls-2-connections": {
    title:
      "2.2 Relationships: Composition (◆), Aggregation (◇) & Inheritance (▷)",
    subtitle: "The subtle semantic differences of UML arrows",
    whyItMatters:
      "Whether a part can survive without its whole (Aggregation ◇) or perishes with it (Composition ◆) determines your entire system lifecycle!",
    explanationHtml: `
      <p>Learn to distinguish the four essential structural relationships:</p>
      <ul>
        <li><strong>Composition (<code>◆──</code> filled diamond at the Whole):</strong> Existence dependency! An <code>OrderItem</code> cannot exist without its <code>Order</code>. If the order is deleted, its line items disappear too.</li>
        <li><strong>Aggregation (<code>◇──</code> hollow diamond at the Whole):</strong> Loose part-whole relationship! A <code>Product</code> can be in a <code>Catalog</code>, but continues to exist if the catalog is removed.</li>
        <li><strong>Generalization / Inheritance (<code>──▷</code> solid line, hollow triangle):</strong> 'Is-a': <code>EBook ──▷ Book</code>.</li>
        <li><strong>Realization (<code>- - ▷</code> dashed line, hollow triangle):</strong> Class implements an interface: <code>Book - - ▷ «interface» Borrowable</code>.</li>
      </ul>
      <p><strong>Memory hook for diamonds:</strong> The diamond (◇ or ◆) <em>always</em> attaches to the <strong>Whole</strong> (the source when dragging Whole → Part)!</p>
    `,
    visualCheck: {
      question:
        "A 'House' consists of several 'Rooms'. Without the house, no individual room continues to exist. Which relationship and direction is correct?",
      options: [
        "Aggregation (hollow diamond ◇ at 'Room', line to 'House')",
        "Inheritance (triangle arrow from 'House' to 'Room')",
        "Composition (filled diamond ◆ at 'House', line leads to 'Room')",
      ],
      correctIndex: 2,
      explanation:
        "Bullseye! Strong existence dependency = Composition (◆), and the diamond always sits at the Whole ('House').",
    },
    taskPrompt:
      "Connect the prepared elements: 1. 'Order' ◆── 'OrderItem' via Composition (diamond at Order!). 2. 'EBook' ──▷ 'Book' via Inheritance. 3. 'Book' - - ▷ 'Borrowable' via Interface Realization.",
    level2ScenarioPrompt:
      "Scenario: In a bookshop, every 'Order' consists of one or more 'OrderItem' entries — if the order is deleted, its items cease to exist as well. An 'EBook' is a specialized kind of 'Book'. Every 'Book' also implements the contract 'Borrowable'. Model all elements and their exact relationships.",
    celebrationMessage:
      "Masterful! Composition, Inheritance, and Realization are spot on.",
    nodeTranslations: {
      cls2_order: "Order",
      cls2_item: "OrderItem",
      cls2_book: "Book",
      cls2_ebook: "EBook",
      cls2_ifc: "Borrowable",
    },
    criteriaDescriptions: {
      "cls2-comp": {
        description:
          "Composition (◆) from 'Order' (Whole) to 'OrderItem' (Part)",
        hint: "Select 'Composition' and drag from 'Order' (where the filled diamond ◆ sits) to 'OrderItem'.",
      },
      "cls2-gen": {
        description:
          "Inheritance (──▷) from subclass 'EBook' to superclass 'Book'",
        hint: "Select 'Inheritance / Generalization' and draw the arrow from 'EBook' to the superclass 'Book'.",
      },
      "cls2-real": {
        description:
          "Interface Realization (- - ▷) from 'Book' to 'Borrowable'",
        hint: "Select 'Interface Realization' (dashed) and draw from 'Book' to 'Borrowable'.",
      },
    },
  },

  "cls-3-detective": {
    title: "2.3 Bug Detective: The Inheritance & Diamond Trap",
    subtitle: "Fix two classic reasoning errors in the vehicle model",
    whyItMatters:
      "Reversed inheritance arrows and confused diamonds appear in almost every team review. Now you learn to fix them on sight.",
    explanationHtml: `
      <p>Two bugs are hidden in this Class Diagram:</p>
      <ol>
        <li>The Inheritance arrow (<code>──▷</code>) currently points from <code>Vehicle</code> to <code>ElectricCar</code> — which would mean every vehicle is an electric car! It must point from the specialized subclass (<code>ElectricCar</code>) to the general superclass (<code>Vehicle</code>).</li>
        <li>Between <code>Fleet</code> and <code>Vehicle</code>, a <strong>Composition (◆)</strong> was used. But a physical vehicle is not scrapped just because a fleet list is dissolved! Change its type to <strong>Aggregation (◇)</strong>.</li>
      </ol>
    `,
    visualCheck: {
      question:
        "Why is Aggregation (◇) more appropriate than Composition (◆) between 'Fleet' and 'Vehicle'?",
      options: [
        "Because vehicles have no attributes",
        "Because a vehicle continues to exist even if the fleet is dissolved and can be reassigned",
        "Because Composition is only allowed on interfaces",
      ],
      correctIndex: 1,
      explanation:
        "Correct! No strict lifecycle/existence dependency = Shared Aggregation (hollow diamond ◇).",
    },
    taskPrompt:
      "1. Click the inheritance arrow between 'Vehicle' and 'ElectricCar' and reverse its direction (⇄). 2. Click the connection between 'Fleet' and 'Vehicle' and change its type in the right inspector from 'Composition' to 'Aggregation'.",
    level2ScenarioPrompt:
      "Scenario Audit: A 'Fleet' groups multiple 'Vehicle' instances; if the fleet is dissolved, the vehicles continue to exist independently. An 'ElectricCar' is a specialized kind of 'Vehicle'. The loaded diagram contradicts both facts — fix it!",
    celebrationMessage:
      "Cleanly diagnosed! Now the domain logic is 100% sound.",
    nodeTranslations: {
      cls3_fleet: "Fleet",
      cls3_vehicle: "Vehicle",
      cls3_ev: "ElectricCar",
    },
    criteriaDescriptions: {
      "cls3-aggr": {
        description: "Aggregation (hollow diamond ◇) from 'Fleet' to 'Vehicle'",
        hint: "Click the connection between 'Fleet' and 'Vehicle' and change its type to 'Aggregation (hollow diamond)' in the inspector.",
      },
      "cls3-gen": {
        description: "Inheritance arrow points from 'ElectricCar' to 'Vehicle'",
        hint: "Click the inheritance arrow between 'Vehicle' and 'ElectricCar' and click 'Reverse Direction ⇄'.",
      },
    },
  },

  "cls-4-capstone": {
    title: "2.4 Stage Finale: The Online Course Portal",
    subtitle:
      "Model a domain structure with classes, composition & inheritance",
    whyItMatters:
      "Being able to sketch clean data models visually saves hours of debate during coding and architecture reviews.",
    explanationHtml: `
      <p><strong>Your Mission:</strong> Design the Class Diagram for an <strong>Online Course Portal</strong>:</p>
      <ul>
        <li>A class <code>Course</code> (with at least 1 attribute, e.g. <code>title</code>).</li>
        <li>A class <code>Lesson</code> that belongs existence-dependently to <code>Course</code> via <strong>Composition (◆)</strong> (diamond at <code>Course</code>!).</li>
        <li>A class <code>VideoLesson</code> that specializes <code>Lesson</code> via <strong>Inheritance (──▷)</strong>.</li>
        <li>A class <code>Student</code> connected to <code>Course</code> via <strong>Association</strong>.</li>
      </ul>
    `,
    visualCheck: {
      question:
        "If a Student can enroll in multiple Courses and a Course has multiple Students, what multiplicities belong on the Association?",
      options: [
        "1..1 on both ends",
        "None, because associations only link single objects",
        "0..* on both ends (many-to-many / n:m)",
      ],
      correctIndex: 2,
      explanation:
        "Exactly! `0..*` (or `*`) on both ends expresses a classic many-to-many relationship.",
    },
    taskPrompt:
      "Model the Online Course Portal with the classes 'Course', 'Lesson', 'VideoLesson', and 'Student' along with their relationships.",
    level2ScenarioPrompt:
      "Scenario: On an Online Course Portal, 'Student' users enroll in 'Course' offerings. Each 'Course' is structured into 'Lesson' units that cannot exist without their parent course. A 'VideoLesson' is a specialized kind of 'Lesson'. Design the complete domain model.",
    celebrationMessage:
      "Fantastic! You completed Stage 2 and unlocked the 'Domain Architect' badge!",
    nodeTranslations: {
      cls4_student: "Student",
      cls4_course: "Course",
      cls4_lesson: "Lesson",
      cls4_video: "VideoLesson",
    },
    criteriaDescriptions: {
      "cls4-nodes": {
        description:
          "Classes 'Course', 'Lesson', 'VideoLesson', and 'Student' exist",
        hint: "Make sure all 4 classes ('Course', 'Lesson', 'VideoLesson', 'Student') are placed.",
      },
      "cls4-comp": {
        description: "Composition (◆) from 'Course' to 'Lesson'",
        hint: "Connect 'Course' (Whole) via Composition (◆) to 'Lesson' (Part).",
      },
      "cls4-gen": {
        description: "Inheritance (──▷) from 'VideoLesson' to 'Lesson'",
        hint: "Draw an Inheritance arrow from 'VideoLesson' to the superclass 'Lesson'.",
      },
      "cls4-assoc": {
        description: "Association between 'Student' and 'Course'",
        hint: "Connect 'Student' and 'Course' with an Association.",
      },
    },
  },

  "act-1-boxes": {
    title: "3.1 Start, Action & End of a Workflow",
    subtitle: "From Initial Node (●) through Actions to the Bullseye (◉)",
    whyItMatters:
      "Every process needs a clear entry point, active steps, and a defined termination.",
    explanationHtml: `
      <p>An <strong>Activity Diagram</strong> describes the 'How' of a workflow:</p>
      <ul>
        <li><strong>Initial Node (● filled circle):</strong> Where the control token is born when the activity starts.</li>
        <li><strong>Action (rounded rectangle):</strong> A single work step phrased with a verb (e.g. <code>Grind Coffee</code>).</li>
        <li><strong>Activity Final (◉ bullseye):</strong> A filled circle inside a ring — terminates the activity.</li>
      </ul>
    `,
    visualCheck: {
      question:
        "How does the symbol for the Initial Node differ from the Activity Final Node?",
      options: [
        "They are identical",
        "The Initial Node is a filled dot (●), while the Activity Final adds an outer ring (◉ bullseye)",
        "The Initial Node is a triangle",
      ],
      correctIndex: 1,
      explanation:
        "Exactly! ● starts the flow, ◉ (bullseye) ends the entire activity.",
    },
    taskPrompt:
      "Build your first control flow: Connect Initial Node (●) → Action 'Grind Coffee' → Action 'Brew Espresso' → Activity Final (◉) using Control Flow arrows.",
    level2ScenarioPrompt:
      "Scenario: Model the complete coffee preparation workflow from start to finish: First 'Grind Coffee', immediately followed by 'Brew Espresso', after which the activity terminates.",
    celebrationMessage: "Great! Your first end-to-end control flow is running.",
    nodeTranslations: {
      act1_start: "Start",
      act1_grind: "Grind Coffee",
      act1_brew: "Brew Espresso",
      act1_end: "End",
    },
    criteriaDescriptions: {
      "act1-nodes": {
        description: "At least 2 Actions and an Activity Final Node (◉)",
        hint: "Add a second Action (e.g. 'Brew Espresso') and an Activity Final Node (◉).",
      },
      "act1-e1": {
        description: "Control Flow from Initial Node to the first Action",
        hint: "Connect the Initial Node (●) via Control Flow to the first Action.",
      },
      "act1-e2": {
        description: "Control Flow between the two Actions",
        hint: "Connect the first Action via Control Flow to the second Action.",
      },
      "act1-e3": {
        description: "Control Flow from the Action to Activity Final (◉)",
        hint: "Connect the last Action via Control Flow to the Activity Final Node (◉).",
      },
    },
  },

  "act-2-connections": {
    title: "3.2 Decisions (◇) with [Guards] & Concurrency (▬)",
    subtitle: "Exclusive branching vs. simultaneous execution",
    whyItMatters:
      "Distinguishing between 'Either-Or' (Diamond ◇) and 'Simultaneously' (Bar ▬) is vital for accurate process models.",
    explanationHtml: `
      <p>There are two fundamentally different ways a workflow path can split:</p>
      <ul>
        <li><strong>Decision Node (◇ Diamond):</strong> <em>Either-Or!</em> Only <strong>one</strong> outgoing path is taken. Therefore every outgoing edge needs a mutually exclusive <strong>[Guard]</strong> condition in brackets, e.g. <code>[Express]</code> and <code>[Standard]</code>.</li>
        <li><strong>Fork Node (▬ Thick Bar):</strong> <em>Both-And!</em> All outgoing paths start <strong>simultaneously in parallel</strong>.</li>
      </ul>
    `,
    visualCheck: {
      question:
        "After payment, the invoice email should be sent AND the parcel packed in the warehouse AT THE SAME TIME. Which symbol do you use?",
      options: [
        "A Decision Diamond (◇)",
        "Two Initial Nodes",
        "A Fork Synchronization Bar (▬)",
      ],
      correctIndex: 2,
      explanation:
        "Correct! For concurrent (parallel) paths, UML uses the Fork/Join bar (▬), not a diamond!",
    },
    taskPrompt:
      "Draw two Control Flows from the Decision Diamond (◇): one to 'Start Express Shipping' (with a guard like '[Express]') and one to 'Start Standard Shipping' (with a guard like '[Standard]').",
    level2ScenarioPrompt:
      "Scenario: After 'Check Order' finishes, the workflow branches depending on the chosen shipping method: Either 'Start Express Shipping' is executed (when express was selected) or 'Start Standard Shipping' (for regular orders). Model the workflow including explicit decision guards.",
    celebrationMessage:
      "Awesome! Your decision diamond now has unambiguous guard conditions.",
    nodeTranslations: {
      act2_order: "Check Order",
      act2_dec: "Shipping Type?",
      act2_express: "Start Express Shipping",
      act2_standard: "Start Standard Shipping",
    },
    criteriaDescriptions: {
      "act2-exp": {
        description:
          "Control Flow from Diamond to 'Start Express Shipping' with Guard",
        hint: "Connect the Diamond to 'Start Express Shipping' and enter a guard condition (e.g. 'Express') in the right inspector.",
      },
      "act2-std": {
        description:
          "Control Flow from Diamond to 'Start Standard Shipping' with Guard",
        hint: "Connect the Diamond to 'Start Standard Shipping' and enter a guard condition (e.g. 'Standard') in the right inspector.",
      },
    },
  },

  "act-3-detective": {
    title: "3.3 Bug Detective: Blind Decision Without Guards",
    subtitle: "Why you should never guess at a decision diamond",
    whyItMatters:
      "A decision diamond without guards on its outgoing arrows is like a signpost without labels.",
    explanationHtml: `
      <p>There is an issue in this credit check workflow:</p>
      <ul>
        <li>After the Decision Diamond <code>Credit OK?</code>, two arrows lead to <code>Approve Loan</code> and <code>Reject Application</code> — but <strong>neither arrow has a [Guard] condition</strong>!</li>
      </ul>
      <p>Click both outgoing arrows from the diamond one after another and add their guard condition in the right inspector (e.g. <code>yes</code> / <code>score &gt;= 700</code> and <code>no</code> / <code>else</code>).</p>
    `,
    visualCheck: {
      question:
        "What does UML 2.5.1 require on the outgoing edges of a Decision Node (◇)?",
      options: [
        "Every outgoing edge needs a [Guard] condition so it is clear when each branch is taken",
        "The edges must be dashed",
        "Only a single edge may ever leave a Decision Node",
      ],
      correctIndex: 0,
      explanation:
        "Exactly! Without `[Guard]` conditions, the branch choice would be undefined.",
    },
    taskPrompt:
      "Click both arrows leaving the diamond 'Credit OK?' and give each a Guard condition or label in the right inspector.",
    level2ScenarioPrompt:
      "Scenario Audit: After 'Check Creditworthiness', the process decides whether to 'Approve Loan' (when credit is sufficient) or 'Reject Application' (otherwise). The loaded diagram is missing the rule specifying when each branch is taken — complete the model!",
    celebrationMessage:
      "Perfect! Now any reader immediately sees when each branch executes.",
    nodeTranslations: {
      act3_check: "Check Creditworthiness",
      act3_dec: "Credit OK?",
      act3_approve: "Approve Loan",
      act3_reject: "Reject Application",
    },
    criteriaDescriptions: {
      "act3-guards": {
        description:
          "All outgoing paths of the Decision Diamond have a [Guard] condition",
        hint: "Click both arrows to the right of the diamond and enter a condition in the 'Guard Condition [Guard]' field (e.g. 'yes' and 'no').",
      },
    },
  },

  "act-4-capstone": {
    title: "3.4 Stage Finale: Parallel Order Fulfillment",
    subtitle: "Model a workflow with Start, Fork concurrency, and End",
    whyItMatters:
      "Parallel paths show at a glance where business processes can be accelerated.",
    explanationHtml: `
      <p><strong>Your Mission:</strong> Model an <strong>Order Fulfillment</strong> workflow:</p>
      <ul>
        <li>An <strong>Initial Node (●)</strong> leads to the Action <code>Receive Order</code>.</li>
        <li>Next, a <strong>Fork Bar (▬)</strong> splits the flow into at least <strong>two simultaneous Actions</strong>: e.g. <code>Pack Goods</code> and <code>Create Invoice</code>.</li>
        <li>Finally, the process reaches an <strong>Activity Final Node (◉)</strong>.</li>
      </ul>
    `,
    visualCheck: {
      question:
        "What happens at a joining Synchronization Bar (Join ▬) when two parallel paths arrive?",
      options: [
        "It cancels the slower branch",
        "It waits until BOTH parallel branches have completed before continuing",
        "It restarts the activity from the beginning",
      ],
      correctIndex: 1,
      explanation:
        "Correct! A Join bar synchronizes concurrency: flow continues only when all incoming tokens have arrived.",
    },
    taskPrompt:
      "Model the workflow with Initial Node (●), 'Receive Order', a Fork Bar (▬) with at least 2 outgoing parallel Actions, and an Activity Final Node (◉).",
    level2ScenarioPrompt:
      "Scenario: Once the process starts and 'Receive Order' is completed, two warehouse tasks happen simultaneously: While a worker executes 'Pack Goods', the billing system concurrently runs 'Create Invoice'. Afterwards the process ends. Model this concurrent workflow.",
    celebrationMessage:
      "Stage 3 Mastered! You are now officially a 'Flow Master'!",
    nodeTranslations: {
      act4_start: "Start",
      act4_recv: "Receive Order",
      act4_fork: "Fork",
      act4_pack: "Pack Goods",
      act4_inv: "Create Invoice",
      act4_end: "End",
    },
    criteriaDescriptions: {
      "act4-actions": {
        description: "At least 3 Actions exist in the diagram",
        hint: "Alongside 'Receive Order', create at least two parallel Actions (e.g. 'Pack Goods' and 'Create Invoice').",
      },
      "act4-fork": {
        description:
          "A Fork Bar (▬) splits the flow into at least 2 outgoing paths",
        hint: "Place a 'Fork / Join Bar' and draw at least 2 Control Flow arrows from it to the parallel Actions.",
      },
      "act4-final": {
        description: "An Activity Final Node (◉) completes the workflow",
        hint: "Add an Activity Final Node (◉).",
      },
    },
  },

  "stm-1-boxes": {
    title: "4.1 What Is a State? (And how does it differ from an Action?)",
    subtitle: "States with entry /, do / and exit /",
    whyItMatters:
      "An Action in an Activity diagram is a brief step. A State is a phase of life in which an object waits until an event occurs!",
    explanationHtml: `
      <p>In a <strong>State Machine Diagram</strong>, we look at the lifecycle of <em>a single object</em> (e.g. a parcel delivery or an article):</p>
      <ul>
        <li><strong>State (rounded rectangle):</strong> Describes a stable condition like <code>Draft</code>, <code>In Review</code>, or <code>Published</code>.</li>
        <li><strong>Internal activities inside a State:</strong>
          <ul>
            <li><code>entry / ...</code> runs immediately upon <em>entering</em> the state.</li>
            <li><code>do / ...</code> executes <em>while</em> the object remains in the state.</li>
            <li><code>exit / ...</code> runs when <em>leaving</em> the state.</li>
          </ul>
        </li>
      </ul>
    `,
    visualCheck: {
      question:
        "When is the internal activity 'entry / lockDoor()' executed inside a State?",
      options: [
        "Only when the object is deleted",
        "Only when an error occurs",
        "Immediately at the moment the object enters this state",
      ],
      correctIndex: 2,
      explanation:
        "Correct! `entry /` runs on entering the state, `do /` while inside it, and `exit /` upon leaving.",
    },
    taskPrompt:
      "Place an Initial State (●) plus the two States 'Draft' and 'Published' (with at least one internal entry/do/exit activity).",
    level2ScenarioPrompt:
      "Scenario: A blog article begins its lifecycle in the state 'Draft'. Later it reaches the state 'Published', automatically triggering a notification as soon as it enters that state. Model the initial pseudostate and both states.",
    celebrationMessage: "Great! You created states with internal behavior.",
    nodeTranslations: {
      stm1_init: "Start",
      stm1_draft: "Draft",
      stm1_pub: "Published",
    },
    criteriaDescriptions: {
      "stm1-init": {
        description: "Initial State (●) is present",
        hint: "Add an Initial State (●).",
      },
      "stm1-draft": {
        description: "State 'Draft' is created",
        hint: "Place a State and name it 'Draft'.",
      },
      "stm1-pub": {
        description:
          "State 'Published' with internal activity (entry / do / exit)",
        hint: "Place a State 'Published' and ensure e.g. `entry / ...` is filled in the right inspector.",
      },
    },
  },

  "stm-2-connections": {
    title: "4.2 State Transitions: Trigger [Guard] / Effect",
    subtitle: "Which events move a system into its next state?",
    whyItMatters:
      "An object never changes state at random — it transitions when a specific event (Trigger) occurs under a defined condition.",
    explanationHtml: `
      <p>An arrow in a State Machine diagram is called a <strong>Transition</strong>. Its label in UML 2.5.1 follows the formula:</p>
      <p><code>event [guard] / effect</code></p>
      <ul>
        <li><strong>Event (Trigger):</strong> What happens externally? (e.g. <code>approve()</code>).</li>
        <li><strong><code>[Guard]</code> (optional):</strong> Only if true does the transition fire (e.g. <code>[reviewed]</code>).</li>
        <li><strong><code>/ Effect</code> (optional):</strong> Action executed during the transition (e.g. <code>/ publish()</code>).</li>
      </ul>
    `,
    visualCheck: {
      question:
        "What does the transition label 'pay [amount >= price] / printTicket()' mean?",
      options: [
        "When the event 'pay' occurs AND the amount is sufficient, the state transitions and 'printTicket()' is executed",
        "The state itself is named 'pay'",
        "The ticket is printed before anyone pays",
      ],
      correctIndex: 0,
      explanation:
        "Exactly! `Trigger [Guard] / Effect` is one of the most expressive notations in all of UML.",
    },
    taskPrompt:
      "1. Connect Initial State (●) → 'Draft'. 2. Draw a Transition from 'Draft' → 'Published' with a label (e.g. 'approve [reviewed] / publish()'). 3. Connect 'Published' → Final State (◉).",
    level2ScenarioPrompt:
      "Scenario: An article starts as 'Draft'. When the event 'approve' occurs (provided it is 'reviewed'), it transitions to 'Published'. When later archived, its lifecycle ends at the Final State. Model all states and transitions.",
    celebrationMessage: "Wonderful! The complete lifecycle is cleanly wired.",
    nodeTranslations: {
      stm2_init: "Start",
      stm2_draft: "Draft",
      stm2_pub: "Published",
      stm2_final: "Archived",
    },
    criteriaDescriptions: {
      "stm2-init": {
        description: "Transition from Initial State (●) to 'Draft'",
        hint: "Draw a Transition from Initial State (●) to 'Draft'.",
      },
      "stm2-pub": {
        description: "Labeled Transition from 'Draft' to 'Published'",
        hint: "Draw a Transition from 'Draft' to 'Published' and give it a label (e.g. 'approve').",
      },
      "stm2-end": {
        description: "Transition from 'Published' to Final State (◉)",
        hint: "Connect 'Published' via Transition to the Final State (◉).",
      },
    },
  },

  "stm-3-detective": {
    title: "4.3 Bug Detective: The Dead-End Order",
    subtitle: "Spot the illegal transition in the order status state machine",
    whyItMatters:
      "State diagrams immediately expose illogical status transitions (such as shipping an order that was already cancelled)!",
    explanationHtml: `
      <p>Inspect the State Machine diagram of an <strong>Order</strong>:</p>
      <ul>
        <li>Currently, the transition <code>ship</code> leads from <code>Cancelled</code> to <code>Delivered</code>! That is a severe logic bug: a cancelled order must never be shipped.</li>
        <li>Instead, the transition must lead from <code>Paid</code> to <code>Delivered</code>!</li>
      </ul>
    `,
    visualCheck: {
      question:
        "What advantage does a State Machine diagram offer over raw code for status rules?",
      options: [
        "It replaces the database completely",
        "You see all allowed AND all forbidden transitions between states at a single glance",
        "It does not require state names",
      ],
      correctIndex: 1,
      explanation:
        "Exactly! Missing or wrongly connected transitions jump out visually right away.",
    },
    taskPrompt:
      "Delete the buggy Transition from 'Cancelled' to 'Delivered' (click → Delete button or Del key) and draw a Transition from 'Paid' to 'Delivered' instead.",
    level2ScenarioPrompt:
      "Scenario Audit: An order starts as 'Open' and can become either 'Paid' or 'Cancelled'. Only a 'Paid' order may subsequently transition to 'Delivered'. The loaded diagram contains a critical business logic flaw — fix it!",
    celebrationMessage:
      "Bug squashed! No cancelled order will ever leave the warehouse again.",
    nodeTranslations: {
      stm3_init: "Start",
      stm3_open: "Open",
      stm3_paid: "Paid",
      stm3_cancel: "Cancelled",
      stm3_deliv: "Delivered",
    },
    criteriaDescriptions: {
      "stm3-no-cancel-deliv": {
        description:
          "Buggy transition from 'Cancelled' to 'Delivered' was removed",
        hint: "Click the arrow between 'Cancelled' and 'Delivered' and delete it.",
      },
      "stm3-paid-deliv": {
        description: "Transition leads from 'Paid' to 'Delivered'",
        hint: "Draw a Transition from 'Paid' to 'Delivered'.",
      },
    },
  },

  "stm-4-capstone": {
    title: "4.4 Stage Finale: The Parcel Locker",
    subtitle: "Model the complete state machine of a smart locker compartment",
    whyItMatters:
      "Whether hardware control, booking systems, or UI components: state machines make complex reactions rock-solid.",
    explanationHtml: `
      <p><strong>Your Mission:</strong> Model the lifecycle of a <strong>Parcel Locker</strong>:</p>
      <ul>
        <li>From the <strong>Initial State (●)</strong>, the compartment enters the state <code>Free</code>.</li>
        <li>When a parcel is inserted, it transitions via a labeled Transition from <code>Free</code> to <code>Occupied</code>.</li>
      </ul>
    `,
    visualCheck: {
      question:
        "May a State Machine diagram contain loops (transitions returning to an earlier state such as from 'Occupied' back to 'Free')?",
      options: [
        "No, states may only be visited once",
        "Only if no events are written on them",
        "Yes, absolutely! Many real systems like a parcel locker or traffic light cycle through states repeatedly",
      ],
      correctIndex: 2,
      explanation:
        "Correct! Cyclic state transitions are completely natural in long-lived systems.",
    },
    taskPrompt:
      "Model the Parcel Locker with Initial State (●), at least the States 'Free' and 'Occupied', and their connecting Transitions.",
    level2ScenarioPrompt:
      "Scenario: A smart parcel locker compartment starts in the state 'Free'. When a courier inserts a parcel ('insertParcel'), the compartment transitions into the state 'Occupied'. Model the state machine from start through these states and transitions.",
    celebrationMessage:
      "Stage 4 Mastered! You now wear the 'State Guardian' badge!",
    nodeTranslations: {
      stm4_init: "Start",
      stm4_free: "Free",
      stm4_occ: "Occupied",
      stm4_end: "Maintenance",
    },
    criteriaDescriptions: {
      "stm4-free": {
        description: "State 'Free' is present",
        hint: "Create a State named 'Free'.",
      },
      "stm4-occ": {
        description: "State 'Occupied' is present",
        hint: "Create a State named 'Occupied'.",
      },
      "stm4-init-edge": {
        description: "Transition from Initial State (●) to 'Free'",
        hint: "Connect the Initial State (●) via Transition to 'Free'.",
      },
      "stm4-to-occ": {
        description:
          "Labeled Transition from 'Free' to 'Occupied' (e.g. 'insertParcel')",
        hint: "Draw a Transition from 'Free' to 'Occupied' and label it with the triggering event.",
      },
    },
  },

  "seq-1-boxes": {
    title: "5.1 The Stage of Interaction: Lifelines",
    subtitle: "Horizontal participants, vertical timeline",
    whyItMatters:
      "When multiple services talk to each other, prose text quickly becomes confusing. Lifelines align each participant side by side while time flows top to bottom.",
    explanationHtml: `
      <p>A <strong>Sequence Diagram</strong> reads in two dimensions:</p>
      <ul>
        <li><strong>Left to right:</strong> The participating partners as <strong>Lifelines</strong>, e.g. <code>Customer</code>, <code>:Webshop</code>, and <code>:PaymentService</code>.</li>
        <li><strong>Top to bottom:</strong> Chronological order! The further down an arrow sits, the later it occurs.</li>
      </ul>
    `,
    visualCheck: {
      question: "In which direction does time flow in a UML Sequence Diagram?",
      options: [
        "Right to left",
        "From top to bottom along the dashed lifelines",
        "Clockwise in a circle",
      ],
      correctIndex: 1,
      explanation:
        "Exactly! The scenario starts at the top, and each message lower down happens later in time.",
    },
    taskPrompt:
      "Set up the participants for a checkout scenario side by side: Place an Actor Lifeline 'Customer' plus two Lifelines ':Webshop' and ':PaymentService'.",
    level2ScenarioPrompt:
      "Scenario: During an online checkout, three participants interact over time: the human 'Customer', the ':Webshop' system, and the ':PaymentService'. Set up the lifelines for their chronological message exchange.",
    celebrationMessage:
      "The stage is set! All three lifelines are ready for exchanging messages.",
    nodeTranslations: {
      seq1_actor: "Customer",
      seq1_shop: ":Webshop",
      seq1_pay: ":PaymentService",
    },
    criteriaDescriptions: {
      "seq1-actor": {
        description: "Actor Lifeline 'Customer' is present",
        hint: "Place an Actor Lifeline named 'Customer'.",
      },
      "seq1-shop": {
        description: "Lifeline ':Webshop' is present",
        hint: "Place a Lifeline and name it ':Webshop'.",
      },
      "seq1-pay": {
        description: "Lifeline ':PaymentService' is present",
        hint: "Place another Lifeline to the right and name it ':PaymentService'.",
      },
    },
  },

  "seq-2-connections": {
    title:
      "5.2 Message Arrows: Synchronous (──▶), Reply (- - >) & Asynchronous (──>)",
    subtitle: "Does the caller wait, or just fire a signal?",
    whyItMatters:
      "In distributed systems and APIs, distinguishing between a blocking call (synchronous) and a fire-and-forget event (asynchronous) is critical.",
    explanationHtml: `
      <p>In UML 2.5.1, you immediately recognize the nature of a message by its <strong>arrowhead and line style</strong>:</p>
      <ul>
        <li><strong>Synchronous Message (<code>──▶</code> solid line, FILLED triangle):</strong> The sender calls an operation and <em>waits blocking</em> for the reply.</li>
        <li><strong>Reply / Return Message (<code>- - &gt;</code> dashed line, open arrow):</strong> Returns the result back to the waiting caller.</li>
        <li><strong>Asynchronous Message (<code>──&gt;</code> solid line, OPEN arrow):</strong> The sender dispatches an event/signal and continues immediately without waiting!</li>
      </ul>
    `,
    visualCheck: {
      question:
        "How do you recognize a SYNCHRONOUS message (caller blocks waiting for reply) in UML 2.5.1?",
      options: [
        "Dashed line with a hollow diamond",
        "Solid line with an open arrowhead (──>)",
        "Solid line with a filled (closed) triangle arrowhead (──▶)",
      ],
      correctIndex: 2,
      explanation:
        "Correct! Filled triangle (──▶) = Synchronous call; open arrowhead (──>) = Asynchronous signal; dashed (- - >) = Reply.",
    },
    taskPrompt:
      "1. Send a Synchronous Message (──▶) from ':Webshop' to ':PaymentService'. 2. Send a Reply Message (- - >) from ':PaymentService' back to ':Webshop'. 3. Send an Asynchronous Message (──>) from ':Webshop' to ':EmailService'.",
    level2ScenarioPrompt:
      "Scenario: ':Webshop' calls ':PaymentService' to charge the card and blocks waiting until ':PaymentService' returns the transaction result. Afterwards, ':Webshop' triggers ':EmailService' to send a confirmation email without waiting for it to finish. Model all participants and messages.",
    celebrationMessage:
      "Excellent! You distinguish synchronous calls, replies, and asynchronous signals like a pro.",
    nodeTranslations: {
      seq2_shop: ":Webshop",
      seq2_pay: ":PaymentService",
      seq2_mail: ":EmailService",
    },
    criteriaDescriptions: {
      "seq2-sync": {
        description:
          "Synchronous Message (──▶) from ':Webshop' to ':PaymentService'",
        hint: "Select 'Synchronous Message (Call)' and draw from ':Webshop' to ':PaymentService'.",
      },
      "seq2-ret": {
        description:
          "Reply Message (- - >) from ':PaymentService' back to ':Webshop'",
        hint: "Select 'Reply / Return Message' and draw from ':PaymentService' back to ':Webshop'.",
      },
      "seq2-async": {
        description:
          "Asynchronous Message (──>) from ':Webshop' to ':EmailService'",
        hint: "Select 'Asynchronous Message (Signal)' and draw from ':Webshop' to ':EmailService'.",
      },
    },
  },

  "seq-3-detective": {
    title: "5.3 Bug Detective: The Wrong Reply Message",
    subtitle: "Why replies in sequence diagrams are not new calls",
    whyItMatters:
      "Drawing a reply as a synchronous call makes it look as if the server is invoking a new operation on the client instead of returning a result.",
    explanationHtml: `
      <p>This login Sequence Diagram contains a classic notation mistake:</p>
      <ul>
        <li><code>:App</code> synchronously calls <code>verifyPassword()</code> on <code>:AuthServer</code>.</li>
        <li>However, the return value <code>jwtToken</code> from <code>:AuthServer</code> back to <code>:App</code> was mistakenly drawn as another <strong>Synchronous Message (solid ──▶)</strong> instead of a <strong>Reply Message (dashed - - &gt;)</strong>!</li>
      </ul>
    `,
    visualCheck: {
      question:
        "How is the return value (Reply) of a synchronous call represented in a Sequence Diagram?",
      options: [
        "As a dashed line with an open arrowhead (- - >) back to the caller",
        "As a solid line with a filled diamond",
        "As a composition arrow",
      ],
      correctIndex: 0,
      explanation:
        "Exactly! The dashed line (- - >) makes it immediately clear that control is returning to the caller with the result.",
    },
    taskPrompt:
      "Click the second message ('jwtToken') from ':AuthServer' to ':App' and change its connection type in the right inspector to 'Reply / Return Message'.",
    level2ScenarioPrompt:
      "Scenario Audit: ':App' calls ':AuthServer' to verify a password and waits until ':AuthServer' returns the 'jwtToken' as a reply. In the loaded diagram, the return arrow uses the wrong UML notation — fix it!",
    celebrationMessage:
      "Perfectly fixed! Request and reply are now visually unmistakable.",
    nodeTranslations: {
      seq3_app: ":App",
      seq3_auth: ":AuthServer",
    },
    criteriaDescriptions: {
      "seq3-sync": {
        description: "Synchronous call from ':App' to ':AuthServer' remains",
        hint: "The first arrow from ':App' to ':AuthServer' must be a Synchronous Message.",
      },
      "seq3-ret": {
        description:
          "Reply from ':AuthServer' to ':App' is a dashed Reply / Return Message",
        hint: "Click the lower arrow ('jwtToken') and set its type to 'Reply / Return Message' in the right inspector.",
      },
    },
  },

  "seq-4-capstone": {
    title: "5.4 Stage Finale: Cinema Ticket Reservation with Reply",
    subtitle: "Model an interaction across three lifelines",
    whyItMatters:
      "Being able to sketch an API call flow across three participants clarifies interface questions in minutes.",
    explanationHtml: `
      <p><strong>Your Mission:</strong> Model a <strong>Cinema Ticket Reservation</strong>:</p>
      <ul>
        <li>An Actor <code>Visitor</code> sends a message to <code>:BookingService</code>.</li>
        <li><code>:BookingService</code> synchronously calls (<code>──▶</code>) <code>reserveSeat()</code> on <code>:SeatMapDB</code>.</li>
        <li><code>:SeatMapDB</code> sends a <strong>Reply Message (<code>- - &gt;</code>)</strong> back to <code>:BookingService</code>.</li>
      </ul>
    `,
    visualCheck: {
      question:
        "Which element is used in a Sequence Diagram when a block of messages executes only under a condition (e.g. `[seat available]`)?",
      options: [
        "A Package symbol",
        "A Combined Fragment with operator `opt` or `alt`",
        "An Actor",
      ],
      correctIndex: 1,
      explanation:
        "Correct! Combined Fragments (`alt`, `opt`, `loop`) frame conditional or repeated messages directly across lifelines.",
    },
    taskPrompt:
      "Model the sequence between 'Visitor', ':BookingService', and ':SeatMapDB'.",
    level2ScenarioPrompt:
      "Scenario: A 'Visitor' sends a seat booking request to ':BookingService'. ':BookingService' makes a blocking synchronous call to ':SeatMapDB' to reserve the seat and receives a reply back from ':SeatMapDB'. Model the complete chronological interaction.",
    celebrationMessage:
      "Stage 5 Mastered! You earned the 'Interaction Conductor' badge!",
    nodeTranslations: {
      seq4_user: "Visitor",
      seq4_svc: ":BookingService",
      seq4_db: ":SeatMapDB",
    },
    criteriaDescriptions: {
      "seq4-db": {
        description: "Lifeline ':SeatMapDB' is present",
        hint: "Add a third Lifeline ':SeatMapDB' on the right.",
      },
      "seq4-msg1": {
        description: "Message from 'Visitor' to ':BookingService'",
        hint: "Draw a message from 'Visitor' to ':BookingService'.",
      },
      "seq4-msg2": {
        description:
          "Synchronous Message (──▶) from ':BookingService' to ':SeatMapDB'",
        hint: "Draw a Synchronous Message from ':BookingService' to ':SeatMapDB'.",
      },
      "seq4-ret": {
        description:
          "Reply Message (- - >) from ':SeatMapDB' back to ':BookingService'",
        hint: "Draw a dashed Reply Message from ':SeatMapDB' back to ':BookingService'.",
      },
    },
  },

  "cmp-1-boxes": {
    title: "6.1 Components («component») & Interfaces (Lollipop / Socket)",
    subtitle: "Modular black-box building blocks",
    whyItMatters:
      "Good systems consist of replaceable modules that hide their internals and communicate only through well-defined plugs (interfaces).",
    explanationHtml: `
      <p>In a <strong>Component Diagram</strong>, you view the high-level building blocks of your architecture:</p>
      <ul>
        <li><strong>Component (<code>«component»</code>):</strong> A self-contained module (e.g. <code>OrderService</code>, <code>PaymentGateway</code>) marked with the component icon in the top-right corner.</li>
        <li><strong>Provided Interface (Lollipop <code>○—</code>):</strong> A closed circle shows which contract a component <em>offers</em> to the outside world.</li>
        <li><strong>Required Interface (Socket <code>)—</code>):</strong> An open half-circle socket shows which interface a component <em>requires</em> from a partner.</li>
      </ul>
    `,
    visualCheck: {
      question:
        "What does the 'Lollipop' symbol (circle on a stick ○—) represent in a UML 2.5.1 Component Diagram?",
      options: [
        "An Initial Node",
        "A deleted class",
        "A Provided Interface offered by a component",
      ],
      correctIndex: 2,
      explanation:
        "Exactly! The Lollipop (circle) is the provided offer; the Socket (half-circle cup) is the required demand.",
    },
    taskPrompt:
      "Place two Components: 'OrderService' and 'PaymentGateway', plus a Provided Interface (Lollipop) 'IPayment'.",
    level2ScenarioPrompt:
      "Scenario: The architecture of an online shop comprises the modular system components 'OrderService' and 'PaymentGateway', as well as the publicly offered interface 'IPayment'. Place these architectural building blocks.",
    celebrationMessage:
      "Great job! Your components and interfaces are ready to be wired.",
    nodeTranslations: {
      cmp1_order: "OrderService",
      cmp1_ifc: "IPayment",
      cmp1_pay: "PaymentGateway",
    },
    criteriaDescriptions: {
      "cmp1-order": {
        description: "Component 'OrderService' is present",
        hint: "Place a Component and name it 'OrderService'.",
      },
      "cmp1-pay": {
        description: "Component 'PaymentGateway' is present",
        hint: "Place a second Component and name it 'PaymentGateway'.",
      },
      "cmp1-lollipop": {
        description: "Provided Interface (Lollipop) 'IPayment' is present",
        hint: "Place a 'Provided Interface (Lollipop)' and name it 'IPayment'.",
      },
    },
  },

  "cmp-2-connections": {
    title: "6.2 Wiring Components: Supply, Demand & Dependencies",
    subtitle: "How plug (Lollipop) and socket meet",
    whyItMatters:
      "When components depend only on interfaces rather than concrete implementations, you can swap out any module painlessly.",
    explanationHtml: `
      <p>How to express wiring between components:</p>
      <ul>
        <li><strong>Interface Realization (<code>- - ▷</code>):</strong> <code>PaymentGateway</code> realizes/provides the interface <code>IPayment</code>.</li>
        <li><strong>Dependency (<code>- - &gt;</code>):</strong> <code>OrderService</code> uses (requires) the interface <code>IPayment</code>.</li>
      </ul>
    `,
    visualCheck: {
      question:
        "In which direction does the dashed Dependency arrow (`- - >`) point when 'OrderService' requires the interface 'IPayment'?",
      options: [
        "From 'IPayment' toward 'OrderService'",
        "From the requiring 'OrderService' toward the interface 'IPayment'",
        "Dependencies have no arrowhead",
      ],
      correctIndex: 1,
      explanation:
        "Correct! The dependency arrow always points from the dependent client toward what it depends on.",
    },
    taskPrompt:
      "1. Connect 'PaymentGateway' via Realization (- - ▷) to 'IPayment'. 2. Connect 'OrderService' via Dependency (- - >) to 'IPayment'.",
    level2ScenarioPrompt:
      "Scenario: To cleanly decouple 'OrderService' and 'PaymentGateway', 'PaymentGateway' realizes the interface 'IPayment', while 'OrderService' depends solely on 'IPayment'. Model the components, the interface, and their connections.",
    celebrationMessage:
      "Clean architecture! Both components are decoupled via the interface.",
    nodeTranslations: {
      cmp2_order: "OrderService",
      cmp2_ifc: "IPayment",
      cmp2_pay: "PaymentGateway",
    },
    criteriaDescriptions: {
      "cmp2-real": {
        description: "Realization (- - ▷) from 'PaymentGateway' to 'IPayment'",
        hint: "Select 'Interface Realization' and draw from 'PaymentGateway' to 'IPayment'.",
      },
      "cmp2-dep": {
        description: "Dependency (- - >) from 'OrderService' to 'IPayment'",
        hint: "Select 'Dependency' and draw from 'OrderService' to 'IPayment'.",
      },
    },
  },

  "cmp-3-detective": {
    title: "6.3 Bug Detective: Inverted Layer Dependency",
    subtitle: "When the database suddenly depends on the user interface",
    whyItMatters:
      "In a clean layered architecture, the UI depends on domain logic — never the database on the UI!",
    explanationHtml: `
      <p>In this architecture diagram, one <strong>Dependency arrow is drawn backwards</strong>:</p>
      <ul>
        <li><code>WebFrontend</code> rightly depends on <code>CoreService</code>.</li>
        <li>However, <code>DatabaseAdapter</code> points with a Dependency arrow to <code>WebFrontend</code>! Delete that wrong arrow and draw a Dependency from <code>CoreService</code> to <code>DatabaseAdapter</code> instead.</li>
      </ul>
    `,
    visualCheck: {
      question:
        "Why is a dependency from 'DatabaseAdapter' onto 'WebFrontend' an architectural red flag?",
      options: [
        "Because the data layer can then no longer be reused or tested without the concrete UI",
        "Because component names may have at most 8 letters",
        "Because databases are not allowed in UML",
      ],
      correctIndex: 0,
      explanation:
        "Exactly! Dependencies point toward the used service layer or abstracted interface.",
    },
    taskPrompt:
      "1. Delete the buggy Dependency arrow from 'DatabaseAdapter' to 'WebFrontend'. 2. Draw a Dependency (- - >) from 'CoreService' to 'DatabaseAdapter'.",
    level2ScenarioPrompt:
      "Scenario Audit: In a three-tier architecture, 'WebFrontend' uses 'CoreService', and 'CoreService' uses 'DatabaseAdapter'. In the loaded diagram, one dependency violates this layering — fix the architecture!",
    celebrationMessage:
      "Clean! The dependency direction of your layered architecture is restored.",
    nodeTranslations: {
      cmp3_ui: "WebFrontend",
      cmp3_core: "CoreService",
      cmp3_db: "DatabaseAdapter",
    },
    criteriaDescriptions: {
      "cmp3-no-db-ui": {
        description:
          "Buggy dependency from 'DatabaseAdapter' to 'WebFrontend' was removed",
        hint: "Click the dashed arrow from 'DatabaseAdapter' to 'WebFrontend' and delete it.",
      },
      "cmp3-core-db": {
        description:
          "Dependency (- - >) leads from 'CoreService' to 'DatabaseAdapter'",
        hint: "Draw a Dependency (- - >) from 'CoreService' to 'DatabaseAdapter'.",
      },
    },
  },

  "cmp-4-capstone": {
    title: "6.4 Grand Finale: Music Streaming Architecture",
    subtitle: "Design the component landscape of a streaming platform",
    whyItMatters:
      "Here you bring everything together: modular components, explicit interfaces, and clean dependencies.",
    explanationHtml: `
      <p><strong>Your Final Mission:</strong> Design the component architecture of a <strong>Music Streaming Platform</strong>:</p>
      <ul>
        <li>At least <strong>three Components (<code>«component»</code>)</strong>: e.g. <code>PlayerApp</code>, <code>StreamingService</code>, and <code>CatalogService</code>.</li>
        <li>At least <strong>one Interface</strong> (Lollipop <code>○—</code> or <code>«interface»</code>), e.g. <code>AudioStreamAPI</code>.</li>
        <li>Wire the components and interfaces using Dependencies, Realizations, or Assembly Connectors.</li>
      </ul>
    `,
    visualCheck: {
      question:
        "What have you gained now that you command all 6 core UML diagram types?",
      options: [
        "You must document every small script with all 14 diagrams simultaneously",
        "You never need to talk to teammates again",
        "For every question (value, structure, workflow, lifecycle, timeline, modular architecture), you can pick the exact visual expression tool that fits",
      ],
      correctIndex: 2,
      explanation:
        "That is the essence: diagrams are tools for clear thinking and human communication!",
    },
    taskPrompt:
      "Model the Music Streaming Platform with at least 3 Components, 1 Interface, and connecting relationships.",
    level2ScenarioPrompt:
      "Scenario: Design the modular architecture of a Music Streaming Platform consisting of 'PlayerApp', 'StreamingService', and 'CatalogService'. Decouple the modules using at least one explicit interface (e.g. 'AudioStreamAPI') and clean dependencies.",
    celebrationMessage:
      "MAGNIFICENT! You completed all 6 stages of the UML 2.5.1 Systems Thinker Academy!",
    nodeTranslations: {
      cmp4_app: "PlayerApp",
      cmp4_api: "AudioStreamAPI",
      cmp4_stream: "StreamingService",
      cmp4_cat: "CatalogService",
    },
    criteriaDescriptions: {
      "cmp4-three-comps": {
        description: "At least 3 Components («component») exist in the diagram",
        hint: "Place at least 3 Components (e.g. 'PlayerApp', 'StreamingService', 'CatalogService').",
      },
      "cmp4-ifc": {
        description:
          "At least 1 Interface (Lollipop, Socket, or «interface») is present",
        hint: "Add at least one Provided Interface (Lollipop).",
      },
      "cmp4-edges": {
        description: "The components and interfaces are wired together",
        hint: "Connect the components via Dependencies (- - >), Realizations (- - ▷), or Assembly Connectors.",
      },
    },
  },
};
