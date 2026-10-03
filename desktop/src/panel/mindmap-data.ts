/**
 * Data model and seeded repository knowledge graph for the Mindmap prototype.
 *
 * Implements Phase 1 of docs/plans/2026-10-03-repo-knowledge-mindmap-prototype.md.
 *
 * Grounded in cognitive psychology (Kintsch CI Model) and software comprehension
 * (Storey et al.):
 * - Every node contains strictly ~1 atomic proposition (statement).
 * - Focus on any node reveals its immediate neighborhood and produces an
 *   integrated macro-synthesis (macro-statement).
 * - Direct orientation pointers ("anchors") indicate where to look in the repo
 *   without code-level syntax clutter.
 */

export interface PropositionAnchor {
  path: string;
  type: "code" | "test" | "schema" | "okf" | "adr" | "config" | "docs";
  description?: string;
}

export interface PropositionEdge {
  id: string;
  relation: string;
  statement: string;
  role?: string;
}

export interface PropositionFacets {
  north: { id?: string; label?: string; statement: string };
  east: { id?: string; label?: string; statement: string };
  south: { id?: string; label?: string; statement: string };
  west: { id?: string; label?: string; statement: string };
}

export interface PropositionTreeItem {
  id?: string;
  label: string;
  statement: string;
}

export interface PropositionTree {
  upstream: PropositionTreeItem[];
  downstream: PropositionTreeItem[];
}

export interface PropositionNode {
  id: string;
  title: string;
  statement: string;
  macroSynthesis: string;
  anchors: PropositionAnchor[];
  neighbors: PropositionEdge[];
  facets: PropositionFacets;
  tree: PropositionTree;
}

export type RepoKnowledgeGraph = Record<string, PropositionNode>;

export const ZAM_ROOT_ID = "zam_root";

/**
 * Seed knowledge graph for the ZAM repository.
 * Fully navigable starting from ZAM_ROOT_ID.
 */
export const ZAM_REPO_KNOWLEDGE: RepoKnowledgeGraph = {
  zam_root: {
    id: "zam_root",
    title: "ZAM Systemüberblick",
    statement:
      "ZAM ist eine lokale, deterministische Spaced-Repetition Lernengine mit optionaler LLM-Assistenz.",
    macroSynthesis:
      "ZAM kombiniert algorithmische Gedächtnisoptimierung mit KI: Das Lernen bleibt deterministisch und lokal, während externe LLMs nur als optionale Assistenten in der Peripherie andocken.",
    anchors: [
      { path: "README.md", type: "docs", description: "Projektüberblick" },
      { path: "AGENTS.md", type: "docs", description: "Architekturregeln für Coding-Agenten" },
      { path: "src/index.ts", type: "code", description: "Öffentlicher Paket-Export" },
    ],
    neighbors: [
      {
        id: "arch_separation",
        relation: "architektonisch getrennt in",
        statement:
          "Architektur trennt strikt den KI-agnostischen Kernel von der CLI- und Agenten-Schicht.",
        role: "Architektur",
      },
      {
        id: "token_card",
        relation: "strukturiert durch",
        statement:
          "ZAM trennt objektive Wissens-Tokens strikt von persönlichen Lernkarten.",
        role: "Datenmodell",
      },
      {
        id: "okf_reference",
        relation: "auditiert durch",
        statement:
          "Architektur und Systemverhalten sind in lebenden OKF-Artikeln formal verifiziert.",
        role: "Dokumentation",
      },
      {
        id: "fsrs_scheduling",
        relation: "gesteuert durch",
        statement:
          "Reviews folgen einem deterministischen FSRS-6-Algorithmus mit persönlichen Stabilitätswerten.",
        role: "Algorithmus",
      },
      {
        id: "observer_privacy",
        relation: "geschützt durch",
        statement:
          "Der Observer erfasst Arbeitskontext nur mit Zwei-Stufen-Zustimmung und lokaler Durchsetzung.",
        role: "Datenschutz",
      },
    ],
    facets: {
      north: {
        statement:
          "Befähigt Entwickler und Lernende zum nachhaltigen Wissensaufbau ohne Abhängigkeit von Cloud-Diensten.",
        label: "Sinn & Zweck",
      },
      east: {
        id: "arch_separation",
        statement:
          "Der Kernel bleibt stets AI-agnostisch: keine Prompt- oder LLM-Aufrufe unter src/kernel/.",
        label: "Hauptinvariante",
      },
      south: {
        statement:
          "Zentrale Definitionen in AGENTS.md, docs/adr/ und Haupteinstieg in src/index.ts.",
        label: "Repo-Einstieg",
      },
      west: {
        id: "token_card",
        statement:
          "Token-Card-Modell trennt universelles Weltwissen von individuellem Lernstand.",
        label: "Fundament",
      },
    },
    tree: {
      upstream: [
        {
          label: "Prämisse",
          statement:
            "Lernende benötigen absolute Privatsphäre, Verlässlichkeit und volle Offline-Funktionsfähigkeit.",
        },
      ],
      downstream: [
        {
          id: "arch_separation",
          label: "Architektur",
          statement: "Trennung in agnostischen Kernel und flexible CLI.",
        },
        {
          id: "token_card",
          label: "Datenmodell",
          statement: "Trennung von objektivem Wissen und persönlichem Fortschritt.",
        },
        {
          id: "fsrs_scheduling",
          label: "Scheduling",
          statement: "FSRS-6 steuert optimale Wiederholungsabstände.",
        },
        {
          id: "okf_reference",
          label: "Dokumentation",
          statement: "Lebende OKF-Artikel garantieren Wissenssynchronität.",
        },
      ],
    },
  },

  arch_separation: {
    id: "arch_separation",
    title: "Architektur-Trennung",
    statement:
      "Architektur trennt strikt den KI-agnostischen Kernel von der CLI- und Agenten-Schicht.",
    macroSynthesis:
      "Der Kern des Lernens bleibt vollkommen unabhängig von Modell-Providern und Netzwerken. Alle flüchtigen HTTP-, Prompt- und LLM-Abläufe sind sauber an den Rand (CLI/Tools) verbannt.",
    anchors: [
      { path: "src/kernel/index.ts", type: "code", description: "Öffentliche Kernel-Fassade" },
      { path: "src/cli/llm/", type: "code", description: "LLM- und Einbettungs-Provider" },
      { path: "docs/okf/kernel-architecture.md", type: "okf", description: "Architektur-Spezifikation" },
      { path: "docs/adr/2026-07-17-kernel-cli-boundary.md", type: "adr", description: "Architekturentscheidung" },
    ],
    neighbors: [
      {
        id: "zam_root",
        relation: "gehört zum System",
        statement:
          "ZAM ist eine lokale, deterministische Spaced-Repetition Lernengine mit optionaler LLM-Assistenz.",
        role: "System",
      },
      {
        id: "kernel_pure",
        relation: "erzwingt",
        statement:
          "Der Kernel darf niemals LLM-, Prompt- oder externe HTTP-Aufrufe enthalten.",
        role: "Invariante",
      },
      {
        id: "mcp_transport",
        relation: "bedient",
        statement:
          "Das Model Context Protocol (zam mcp) ist die bevorzugte Schnittstelle für Coding-Agenten.",
        role: "Transport",
      },
      {
        id: "bridge_protocol",
        relation: "unterstützt",
        statement:
          "zam bridge dient als rein maschinenlesbarer JSON-Fallback-Transport für externe Tools.",
        role: "Fallback",
      },
    ],
    facets: {
      north: {
        id: "zam_root",
        statement:
          "Gewährleistet Langlebigkeit, Testbarkeit und Determinismus der ZAM-Lernengine.",
        label: "Architektur-Ziel",
      },
      east: {
        id: "kernel_pure",
        statement:
          "Kein npm-Paket für externe LLMs oder HTTP darf jemals in den Kernel importiert werden.",
        label: "Harte Grenze",
      },
      south: {
        statement:
          "Logik in src/kernel/; CLI-Orchestrierung in src/cli/; Tests in tests/kernel/.",
        label: "Fundorte",
      },
      west: {
        id: "mcp_transport",
        statement:
          "CLI-Tools und MCP-Server binden an den Kernel über die exportierte Fassade src/kernel/index.ts an.",
        label: "Schnittstelle",
      },
    },
    tree: {
      upstream: [
        {
          id: "zam_root",
          label: "Ursprung",
          statement: "ZAM erfordert deterministische Tests ohne externe API-Latenz und Kosten.",
        },
      ],
      downstream: [
        {
          id: "kernel_pure",
          label: "Regel",
          statement: "Strikte Reinheit des Kernels ohne LLM-Abhängigkeiten.",
        },
        {
          id: "mcp_transport",
          label: "Agenten",
          statement: "MCP bindet Coding-Agenten standardisiert an.",
        },
        {
          id: "bridge_protocol",
          label: "Automatisierung",
          statement: "CLI bridge ermöglicht skriptbare JSON-Kommandos.",
        },
      ],
    },
  },

  kernel_pure: {
    id: "kernel_pure",
    title: "Kernel-Reinheit",
    statement:
      "Der Kernel darf niemals LLM-, Prompt- oder externe HTTP-Aufrufe enthalten.",
    macroSynthesis:
      "Der ZAM-Kernel ist eine reine mathematisch-logische State-Engine. Vektoren werden gespeichert und gerankt, aber niemals im Kernel generiert; die einzige Netzwerk-Ausnahme ist der binding-freie Remote-DB-Treiber.",
    anchors: [
      { path: "src/kernel/index.ts", type: "code", description: "Einziger Einstiegspunkt" },
      { path: "src/kernel/db/types.ts", type: "schema", description: "Database-Contract" },
      { path: "src/kernel/db/remote/hrana.ts", type: "code", description: "Einzige Netzwerk-Ausnahme (libSQL)" },
      { path: "tests/kernel/index.test.ts", type: "test", description: "Fassadentests" },
    ],
    neighbors: [
      {
        id: "arch_separation",
        relation: "definiert durch",
        statement:
          "Architektur trennt strikt den KI-agnostischen Kernel von der CLI- und Agenten-Schicht.",
        role: "Architektur",
      },
      {
        id: "token_card",
        relation: "verwaltet",
        statement:
          "ZAM trennt objektive Wissens-Tokens strikt von persönlichen Lernkarten.",
        role: "Daten",
      },
      {
        id: "blocking_mechanic",
        relation: "berechnet",
        statement:
          "Wird ein Fundament vergessen, werden abhängige Karten temporär via Prerequisite-Blocking pausiert.",
        role: "Algorithmus",
      },
    ],
    facets: {
      north: {
        id: "arch_separation",
        statement:
          "Ermöglicht blitzschnelle Ausführung aller Vitest-Suites ohne Mocks oder Internet.",
        label: "Zweck",
      },
      east: {
        statement:
          "Kein fetch() oder axios im Kernel; HTTP nur per Dependency-Injection (z.B. ReferenceFetcher).",
        label: "Invariante",
      },
      south: {
        statement:
          "src/kernel/db/types.ts für Datenbankzugriff; src/kernel/db/remote/hrana.ts für libSQL.",
        label: "Fundorte",
      },
      west: {
        id: "token_card",
        statement:
          "Kernel stellt relationale Tabellen und FSRS-Berechnungen bereit.",
        label: "Beziehung",
      },
    },
    tree: {
      upstream: [
        {
          id: "arch_separation",
          label: "Vorgabe",
          statement: "Zwei-Schichten-Modell aus AGENTS.md und ADR 2026-07-17.",
        },
      ],
      downstream: [
        {
          label: "DB-Contract",
          statement: "Datenbankzugriff nur über async Database-Vertrag.",
        },
        {
          label: "ULID-Pflicht",
          statement: "Alle Entitäts-IDs sind ULIDs, niemals UUIDs oder Auto-Inkrement.",
        },
      ],
    },
  },

  token_card: {
    id: "token_card",
    title: "Token-Card-Modell",
    statement:
      "ZAM trennt objektive Wissens-Tokens strikt von persönlichen Lernkarten (Cards).",
    macroSynthesis:
      "Wissen ist ein objektiver, gerichteter Graph aus Konzepten (Tokens), der von allen Lernenden geteilt wird. Die persönliche Lernkurve (FSRS) dockt als individuelle Karte (Card) daran an.",
    anchors: [
      { path: "src/kernel/db/schema.ts", type: "schema", description: "Tabellen tokens, cards, token_prerequisites" },
      { path: "beliefs/knowledge-structure/token-card-separation/README.md", type: "docs", description: "Philosophische Begründung" },
      { path: "docs/okf/token-card-model.md", type: "okf", description: "OKF Referenzdokument" },
    ],
    neighbors: [
      {
        id: "zam_root",
        relation: "Fundament von",
        statement:
          "ZAM ist eine lokale, deterministische Spaced-Repetition Lernengine mit optionaler LLM-Assistenz.",
        role: "System",
      },
      {
        id: "blocking_mechanic",
        relation: "ermöglicht",
        statement:
          "Wird ein Fundament vergessen, werden abhängige Karten temporär via Prerequisite-Blocking pausiert.",
        role: "Mechanismus",
      },
      {
        id: "fsrs_scheduling",
        relation: "verknüpft mit",
        statement:
          "Reviews folgen einem deterministischen FSRS-6-Algorithmus mit persönlichen Stabilitätswerten.",
        role: "Scheduling",
      },
    ],
    facets: {
      north: {
        id: "zam_root",
        statement:
          "Trennt zeitlose Fakten und Zusammenhänge von der flüchtigen individuellen Gedächtnisleistung.",
        label: "Konzeptioneller Sinn",
      },
      east: {
        statement:
          "Das Veralten eines Wissens-Tokens löscht niemals die historische Review-Historie des Lernenden.",
        label: "Schutz-Invariante",
      },
      south: {
        statement:
          "src/kernel/db/schema.ts für Tabellen; src/kernel/study/ für Kartenauswahl.",
        label: "Fundorte",
      },
      west: {
        id: "blocking_mechanic",
        statement:
          "Prerequisite-Kanten verbinden Tokens untereinander, steuern aber das Pausieren der Cards.",
        label: "Wirkung",
      },
    },
    tree: {
      upstream: [
        {
          id: "zam_root",
          label: "Grundsatz",
          statement: "Wissen muss teilbar sein, während Lernfortschritt privat bleibt.",
        },
      ],
      downstream: [
        {
          id: "blocking_mechanic",
          label: "Schutz",
          statement: "Pausieren abhängiger Karten bei Fundamentallücken.",
        },
        {
          id: "fsrs_scheduling",
          label: "Intervall",
          statement: "Cards tragen FSRS-Stabilität und nächstes Fälligkeitsdatum.",
        },
      ],
    },
  },

  blocking_mechanic: {
    id: "blocking_mechanic",
    title: "Prerequisite-Blocking",
    statement:
      "Wird ein Fundament vergessen, werden abhängige Karten temporär via Prerequisite-Blocking pausiert.",
    macroSynthesis:
      "Lernende werden vor Frustration und Zeitverschwendung geschützt: Sobald eine fundamentale Wissenseinheit im Gedächtnis verblasst, pausiert ZAM abgeleitete Themen und rückt das Fundament wieder in den Fokus.",
    anchors: [
      { path: "src/kernel/study/blocking.ts", type: "code", description: "Sperr- und Freigabelogik" },
      { path: "tests/kernel/blocking.test.ts", type: "test", description: "Vitest Testsuite" },
      { path: "docs/okf/prerequisite-blocking.md", type: "okf", description: "Spezifikation" },
      { path: "beliefs/knowledge-structure/dependency-graphs/README.md", type: "docs", description: "Graphen-Grundsätze" },
    ],
    neighbors: [
      {
        id: "token_card",
        relation: "baut auf",
        statement:
          "ZAM trennt objektive Wissens-Tokens strikt von persönlichen Lernkarten.",
        role: "Datenmodell",
      },
      {
        id: "fsrs_scheduling",
        relation: "ergänzt",
        statement:
          "Reviews folgen einem deterministischen FSRS-6-Algorithmus mit persönlichen Stabilitätswerten.",
        role: "Scheduling",
      },
    ],
    facets: {
      north: {
        id: "token_card",
        statement:
          "Verhindert das sinnlose Einüben komplexer Inhalte, wenn Basiskonzepte nicht mehr abrufbar sind.",
        label: "Pädagogischer Sinn",
      },
      east: {
        statement:
          "Karten werden niemals gelöscht oder degradiert, sondern verharren im Status 'blocked'.",
        label: "Invariante",
      },
      south: {
        statement:
          "src/kernel/study/blocking.ts für den Graph-Traversal; tests/kernel/blocking.test.ts.",
        label: "Fundorte",
      },
      west: {
        id: "fsrs_scheduling",
        statement:
          "Wird bei jeder Review-Abgabe via submitReview im Kernel atomar neu bewertet.",
        label: "Trigger",
      },
    },
    tree: {
      upstream: [
        {
          id: "token_card",
          label: "Voraussetzung",
          statement: "Tokens besitzen gerichtete, azyklische Prerequisite-Beziehungen.",
        },
      ],
      downstream: [
        {
          label: "Status",
          statement: "Temporärer Status 'blocked' statt irreversibler Löschung.",
        },
        {
          label: "Entsperrung",
          statement: "Erfolgreicher Abruf des Fundaments entsperrt abhängige Karten wieder.",
        },
      ],
    },
  },

  fsrs_scheduling: {
    id: "fsrs_scheduling",
    title: "FSRS-6 Scheduling",
    statement:
      "Reviews folgen einem deterministischen FSRS-6-Algorithmus mit persönlichen Stabilitätswerten.",
    macroSynthesis:
      "ZAM optimiert die Behaltensleistung wissenschaftlich fundiert: Wiederholungsabstände wachsen exponentiell mit der Stabilität, gedeckelt auf ein 20-Tage-Limit für getippte Schnellantworten.",
    anchors: [
      { path: "src/kernel/fsrs/", type: "code", description: "FSRS-6 Algorithmen-Implementierung" },
      { path: "tests/kernel/fsrs.test.ts", type: "test", description: "Mathematische Verifikationstests" },
      { path: "docs/okf/fsrs-scheduling.md", type: "okf", description: "OKF-Dokumentation" },
      { path: "docs/adr/2026-09-27-choice-and-auto-learning-modes.md", type: "adr", description: "Entscheidungs-Rationale" },
    ],
    neighbors: [
      {
        id: "token_card",
        relation: "steuert Karten in",
        statement:
          "ZAM trennt objektive Wissens-Tokens strikt von persönlichen Lernkarten.",
        role: "Datenbasis",
      },
      {
        id: "blocking_mechanic",
        relation: "koordiniert mit",
        statement:
          "Wird ein Fundament vergessen, werden abhängige Karten temporär via Prerequisite-Blocking pausiert.",
        role: "Blockierung",
      },
    ],
    facets: {
      north: {
        statement:
          "Maximiert die Behaltensleistung bei minimalem täglichen Zeitaufwand.",
        label: "Ziel",
      },
      east: {
        statement:
          "Jedes Rating deklariert sein Antwortformat: getippte Schnellantworten haben ein 20-Tage-Intervall-Limit.",
        label: "Invariante",
      },
      south: {
        statement:
          "src/kernel/fsrs/ für Formeln; docs/okf/fsrs-scheduling.md für Spezifikation.",
        label: "Fundorte",
      },
      west: {
        id: "token_card",
        statement:
          "Berechnungen laufen ohne Netzwerkzugriff vollständig lokal im Speicher.",
        label: "Laufzeit",
      },
    },
    tree: {
      upstream: [
        {
          id: "token_card",
          label: "Input",
          statement: "Bestehende Review-Logs und Card-Parameter (S, D, R).",
        },
      ],
      downstream: [
        {
          label: "Due-Date",
          statement: "Berechnung des exakten nächsten Fälligkeitstermins.",
        },
        {
          label: "Deckel",
          statement: "Tap-Ceiling verhindert Selbstüberzeugung bei Multiple-Choice.",
        },
      ],
    },
  },

  okf_reference: {
    id: "okf_reference",
    title: "OKF Wissens-Bundle",
    statement:
      "Architektur und Systemverhalten sind in lebenden OKF-Artikeln formal verifiziert.",
    macroSynthesis:
      "Das Repository ist seine eigene Wissensquelle: Dokumentation veraltet nicht in externen Wikis, sondern wird als lebender, auditiertes Teil der Codebasis im Open Knowledge Format gepflegt.",
    anchors: [
      { path: "docs/okf/", type: "okf", description: "Wissensartikel (Single Source of Truth)" },
      { path: "src/cli/commands/okf.ts", type: "code", description: "OKF CLI-Tools" },
      { path: "docs/adr/", type: "adr", description: "Architekturentscheidungen (Citations)" },
    ],
    neighbors: [
      {
        id: "zam_root",
        relation: "dokumentiert",
        statement:
          "ZAM ist eine lokale, deterministische Spaced-Repetition Lernengine mit optionaler LLM-Assistenz.",
        role: "System",
      },
      {
        id: "arch_separation",
        relation: "beschreibt",
        statement:
          "Architektur trennt strikt den KI-agnostischen Kernel von der CLI- und Agenten-Schicht.",
        role: "Architektur",
      },
    ],
    facets: {
      north: {
        id: "zam_root",
        statement:
          "Garantiert synchron bleibende Systemdokumentation für menschliche Entwickler und KI-Agenten.",
        label: "Zweck",
      },
      east: {
        statement:
          "docs/okf/ darf niemals von Hand editiert werden, sondern nur über das Tool zam_okf_upsert.",
        label: "Invariante",
      },
      south: {
        statement:
          "Artikel unter docs/okf/; Audit-Log in docs/okf/log.md; Index in docs/okf/index.md.",
        label: "Fundorte",
      },
      west: {
        statement:
          "Git-gestützter Freshness-Audit prüft bei jedem PR, ob referenzierte Code-Pfade geändert wurden.",
        label: "Auditierung",
      },
    },
    tree: {
      upstream: [
        {
          id: "zam_root",
          label: "Ziel",
          statement: "Repo als autarke, selbstbeschreibende Wissenseinheit.",
        },
      ],
      downstream: [
        {
          label: "Tooling-Pflicht",
          statement: "Schreibzugriff ausschließlich über zam_okf_upsert.",
        },
        {
          label: "Entscheidungsbezug",
          statement: "Jeder Artikel verweist auf grundlegende ADRs unter docs/adr/.",
        },
      ],
    },
  },

  observer_privacy: {
    id: "observer_privacy",
    title: "Observer-Datenschutz",
    statement:
      "Der Observer erfasst Arbeitskontext nur mit Zwei-Stufen-Zustimmung und lokaler Durchsetzung.",
    macroSynthesis:
      "Datenschutz by Design: Screen- und Kontext-Erfassung zur automatischen Kartengenerierung findet nur nach expliziter doppelter Freigabe statt. Sämtliche Richtlinien werden lokal vor dem Absenden erzwungen.",
    anchors: [
      { path: "observer/", type: "code", description: "Nativer Rust Observer-Sidecar" },
      { path: "docs/okf/observer-privacy-model.md", type: "okf", description: "Observer-Spezifikation" },
      { path: "src/cli/commands/observer.ts", type: "code", description: "CLI-Steuerung" },
    ],
    neighbors: [
      {
        id: "zam_root",
        relation: "schützt",
        statement:
          "ZAM ist eine lokale, deterministische Spaced-Repetition Lernengine mit optionaler LLM-Assistenz.",
        role: "System",
      },
    ],
    facets: {
      north: {
        statement:
          "Erlaubt kontextuelles Lernen am realen Arbeitsplatz ohne Preisgabe vertraulicher Daten.",
        label: "Zweck",
      },
      east: {
        statement:
          "Kein Bild wird analysiert, bevor die ObserverPolicy lokal grünes Licht gegeben hat.",
        label: "Invariante",
      },
      south: {
        statement:
          "observer/src/ für Rust-Sidecar; docs/okf/observer-privacy-model.md für Sicherheitsaudit.",
        label: "Fundorte",
      },
      west: {
        id: "zam_root",
        statement:
          "Dockt über lokale IPC-Sockets an die Desktop-App an, niemals über das öffentliche Internet.",
        label: "Transport",
      },
    },
    tree: {
      upstream: [
        {
          id: "zam_root",
          label: "Prinzip",
          statement: "Lokale Datenhoheit des Nutzers als oberstes Gebot.",
        },
      ],
      downstream: [
        {
          label: "Zwei-Stufen-Zustimmung",
          statement: "Systemberechtigung + In-App-Freigabe zwingend erforderlich.",
        },
        {
          label: "Maskierung",
          statement: "Lokale Filterung von Passwörtern und sensiblen Bereichen.",
        },
      ],
    },
  },

  mcp_transport: {
    id: "mcp_transport",
    title: "MCP-Agenten-Schnittstelle",
    statement:
      "Das Model Context Protocol (zam mcp) ist die bevorzugte Schnittstelle für Coding-Agenten.",
    macroSynthesis:
      "Agenten wie Antigravity, Claude Code oder VS Code Copilot steuern ZAM über standardisierte MCP-Tools. Das reduziert Kontext-Overhead und garantiert strukturierte JSON-Antworten.",
    anchors: [
      { path: "src/cli/commands/mcp.ts", type: "code", description: "MCP-Server-Implementierung" },
      { path: "docs/okf/mcp-surfaces.md", type: "okf", description: "OKF Spezifikation der MCP-Surfaces" },
      { path: "mcp.json", type: "config", description: "MCP Konfiguration" },
    ],
    neighbors: [
      {
        id: "arch_separation",
        relation: "definiert in CLI von",
        statement:
          "Architektur trennt strikt den KI-agnostischen Kernel von der CLI- und Agenten-Schicht.",
        role: "Architektur",
      },
      {
        id: "bridge_protocol",
        relation: "überlegen gegenüber",
        statement:
          "zam bridge dient als rein maschinenlesbarer JSON-Fallback-Transport für externe Tools.",
        role: "Alternative",
      },
    ],
    facets: {
      north: {
        statement:
          "Standardisierte Integration von KI-Harnesses ohne proprietäre Wrapper.",
        label: "Zweck",
      },
      east: {
        statement:
          "MCP-Tools verändern Daten nur über den Kernel; keine direkten DB-Schreiboperationen in mcp.ts.",
        label: "Invariante",
      },
      south: {
        statement:
          "src/cli/commands/mcp.ts für Tool-Registrierungen; docs/okf/mcp-surfaces.md.",
        label: "Fundorte",
      },
      west: {
        id: "arch_separation",
        statement:
          "Wird erst on-demand per await import() geladen, um CLI-Startzeiten minimal zu halten.",
        label: "Laufzeit",
      },
    },
    tree: {
      upstream: [
        {
          id: "arch_separation",
          label: "Schicht",
          statement: "Orchestrierungsebene außerhalb des Kernels.",
        },
      ],
      downstream: [
        {
          label: "App-Surfaces",
          statement: "MCP-Apps wie zam_show_graph und zam_okf_visualize.",
        },
        {
          label: "Verbindung",
          statement: "zam agent connect richtet Harnesses automatisch ein.",
        },
      ],
    },
  },

  bridge_protocol: {
    id: "bridge_protocol",
    title: "Bridge CLI-Protokoll",
    statement:
      "zam bridge dient als rein maschinenlesbarer JSON-Fallback-Transport für externe Tools.",
    macroSynthesis:
      "Universelle Skriptbarkeit: Wenn ein Agent oder Tool MCP nicht unterstützt, garantiert `zam bridge` eine deterministische JSON-over-stdout-Kommunikation ohne unformatierte Log-Ausgaben.",
    anchors: [
      { path: "src/cli/commands/bridge.ts", type: "code", description: "Bridge CLI-Kommando" },
      { path: "src/bridge/bridge-handlers.ts", type: "code", description: "Dispatcher und Handler" },
      { path: "docs/okf/bridge-protocol.md", type: "okf", description: "Protokoll-Spezifikation" },
    ],
    neighbors: [
      {
        id: "arch_separation",
        relation: "gehört zur CLI von",
        statement:
          "Architektur trennt strikt den KI-agnostischen Kernel von der CLI- und Agenten-Schicht.",
        role: "Architektur",
      },
      {
        id: "mcp_transport",
        relation: "Fallback für",
        statement:
          "Das Model Context Protocol (zam mcp) ist die bevorzugte Schnittstelle für Coding-Agenten.",
        role: "Modernisierung",
      },
    ],
    facets: {
      north: {
        statement:
          "Ermöglicht Subprozess-Steuerung aus Bash, CI/CD und beliebigen Programmiersprachen.",
        label: "Zweck",
      },
      east: {
        statement:
          "zam bridge emittiert ausnahmslos JSON – kein einziges stray console.log auf stdout erlaubt.",
        label: "Harte Regel",
      },
      south: {
        statement:
          "src/cli/commands/bridge.ts und src/bridge/bridge-handlers.ts; docs/okf/bridge-protocol.md.",
        label: "Fundorte",
      },
      west: {
        id: "arch_separation",
        statement:
          "Öffnet die DB, ruft Kernel-Funktion auf, emittiert JSON und schließt DB sauber.",
        label: "Ablauf",
      },
    },
    tree: {
      upstream: [
        {
          id: "arch_separation",
          label: "CLI-Basis",
          statement: "Schlanke Orchestrierung ohne eigene Fachlogik.",
        },
      ],
      downstream: [
        {
          label: "JSON-Garantie",
          statement: "jsonOut und jsonError fangen alle Ausgaben ab.",
        },
        {
          label: "Testing",
          statement: "Vollständige Abdeckung in tests/bridge/.",
        },
      ],
    },
  },
};
