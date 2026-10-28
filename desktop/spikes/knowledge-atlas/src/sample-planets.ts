/**
 * Sample content for the planets beside world knowledge. Everything here is
 * invented: "Nordwind Software" is a fictional company, its products, teams
 * and people too. It shows three things:
 *
 * - The same title on several islands is different knowledge
 *   ("Troubleshooting" per product).
 * - Team knowledge often adapts world knowledge ("Scrum bei Team Boreas"
 *   builds on "Scrum").
 * - Private knowledge stays on its own planet.
 */
import type { StartSamples, ThreadKind } from "./atlas.ts";
import { SAMPLE_THREADS } from "./sample-threads.ts";

export interface SampleUnit {
  id: string;
  title: string;
  /** Lens id → names from island to leaf. */
  paths: Record<string, string[]>;
  cards: Array<[question: string, answer: string]>;
}

export interface SampleThread {
  a: string;
  b: string;
  kind: ThreadKind;
  note?: string;
}

// ── Weltwissen: a little software engineering, the ground team knowledge stands on ──

export interface SampleWorldUnit {
  id: string;
  title: string;
  topic: string;
  cards: Array<[string, string]>;
}

export const WORLD_SOFTWARE: SampleWorldUnit[] = [
  {
    id: "sw-agil",
    title: "Agiles Manifest: die vier Werte",
    topic: "Agile Arbeitsweisen",
    cards: [["Welche vier Werte stellt das Agile Manifest voran?", "Individuen und Interaktionen, funktionierende Software, Zusammenarbeit mit Kunden, Reagieren auf Veränderung."]],
  },
  {
    id: "sw-scrum",
    title: "Scrum: Verantwortlichkeiten, Events, Artefakte",
    topic: "Agile Arbeitsweisen",
    cards: [
      ["Welche drei Verantwortlichkeiten kennt Scrum?", "Product Owner, Scrum Master und Developers."],
      ["Welche Events hat ein Sprint?", "Sprint Planning, Daily Scrum, Sprint Review und Sprint Retrospective."],
    ],
  },
  {
    id: "sw-kanban",
    title: "Kanban: Fluss und WIP-Limits",
    topic: "Agile Arbeitsweisen",
    cards: [["Wozu dient ein WIP-Limit?", "Es begrenzt die gleichzeitig begonnene Arbeit, damit Arbeit fertig wird, statt sich zu stauen."]],
  },
  {
    id: "sw-rest",
    title: "REST: Ressourcen und HTTP-Methoden",
    topic: "Web und Schnittstellen",
    cards: [["Welche HTTP-Methode ändert eine Ressource teilweise?", "PATCH – PUT ersetzt sie ganz, POST legt eine neue an."]],
  },
  {
    id: "sw-http",
    title: "HTTP-Statuscodes",
    topic: "Web und Schnittstellen",
    cards: [["Was unterscheidet 4xx- von 5xx-Statuscodes?", "4xx: Der Fehler liegt in der Anfrage (z. B. 404, 409, 429). 5xx: Er liegt beim Server."]],
  },
  {
    id: "sw-oauth",
    title: "OAuth 2.0: Token und Scopes",
    topic: "Web und Schnittstellen",
    cards: [["Was legt ein Scope bei OAuth 2.0 fest?", "Wozu ein Access Token berechtigt – zum Beispiel nur lesen."]],
  },
  {
    id: "sw-git",
    title: "Git: Commit, Branch, Merge",
    topic: "Versionsverwaltung",
    cards: [["Was ist ein Branch in Git?", "Ein beweglicher Zeiger auf einen Commit – eine eigene Entwicklungslinie."]],
  },
  {
    id: "sw-log",
    title: "Log-Level: von DEBUG bis ERROR",
    topic: "Betrieb von Software",
    cards: [["In welcher Reihenfolge stehen die üblichen Log-Level?", "TRACE, DEBUG, INFO, WARN, ERROR – von gesprächig bis ernst."]],
  },
];

export const WORLD_SOFTWARE_THREADS: SampleThread[] = [
  { a: "sw-scrum", b: "sw-agil", kind: "ist-ein", note: "Scrum ist ein agiles Framework." },
  { a: "sw-kanban", b: "sw-agil", kind: "ist-ein", note: "Kanban ist eine agile Methode." },
  { a: "sw-http", b: "sw-rest", kind: "voraussetzung", note: "REST antwortet mit HTTP-Statuscodes." },
];

// ── Firma: Nordwind Software (fictional) ─────────────────────────────────────

export const FIRMA_HUES: Record<string, Record<string, number>> = {
  organisation: { "Team Boreas": 208, "Team Föhn": 28, "Team Passat": 145, "Team Mistral": 275, "Team Zephyr": 345 },
  produkte: { "Archiv-Server": 212, "Desktop-Client": 150, "Web-App": 272, "Archiv-API": 26, "Connector-Hub": 340, Arbeitsweise: 48 },
};

const org = (bereich: string, team: string, aufgabe: string) => [bereich, team, aufgabe];
const prod = (linie: string, produkt: string, komponente: string) => [linie, produkt, komponente];

export const FIRMA_UNITS: SampleUnit[] = [
  {
    id: "nw-ts-server",
    title: "Troubleshooting Archiv-Server",
    paths: { organisation: org("Plattform", "Team Boreas", "Betrieb"), produkte: prod("Dokumentenplattform", "Archiv-Server", "Betrieb") },
    cards: [
      ["Wo findest du beim Archiv-Server den ersten Hinweis auf einen Fehler?", "Im Server-Log und am Health-Endpunkt /health, der Datenbank, Speicher und Index meldet."],
      ["Was bedeutet der Health-Status DEGRADED?", "Der Server läuft, aber ein abhängiger Dienst antwortet nicht – meist der Index: Ablage geht, Suche ist eingeschränkt."],
    ],
  },
  {
    id: "nw-speicher",
    title: "Speicherklassen und Aufbewahrungsfristen",
    paths: { organisation: org("Plattform", "Team Boreas", "Speicher"), produkte: prod("Dokumentenplattform", "Archiv-Server", "Speicher") },
    cards: [["Was passiert mit einem Dokument in der Speicherklasse „Kalt“?", "Es liegt auf günstigem Langzeitspeicher; der Abruf dauert Sekunden statt Millisekunden."]],
  },
  {
    id: "nw-index",
    title: "Suchindex neu aufbauen",
    paths: { organisation: org("Plattform", "Team Boreas", "Suche"), produkte: prod("Dokumentenplattform", "Archiv-Server", "Suche") },
    cards: [["Wann muss der Suchindex neu aufgebaut werden?", "Nach einer Änderung des Analysers oder wenn archivierte Dokumente in der Suche fehlen – im Wartungsfenster."]],
  },
  {
    id: "nw-api",
    title: "Archiv-API: /cabinets und /documents",
    paths: { organisation: org("Plattform", "Team Föhn", "API-Design"), produkte: prod("Integration", "Archiv-API", "Endpunkte") },
    cards: [
      ["Was liefert die Archiv-API unter /cabinets?", "Die Ablagen mit ihren Metadaten; Dokumente liegen darunter unter /cabinets/{id}/documents."],
      ["Mit welchem Statuscode antwortet die Archiv-API, wenn ein Dokument ausgecheckt ist?", "409 Conflict – mit dem Namen der Person, die es ausgecheckt hat."],
    ],
  },
  {
    id: "nw-api-auth",
    title: "Archiv-API: Anmeldung mit OAuth-Client",
    paths: { organisation: org("Plattform", "Team Föhn", "Sicherheit"), produkte: prod("Integration", "Archiv-API", "Sicherheit") },
    cards: [["Wie meldet sich eine Integration an der Archiv-API an?", "Über einen OAuth-Client (Client Credentials) mit dem Scope archive.read oder archive.write."]],
  },
  {
    id: "nw-api-limits",
    title: "Archiv-API: Rate Limits",
    paths: { organisation: org("Plattform", "Team Föhn", "Betrieb"), produkte: prod("Integration", "Archiv-API", "Betrieb") },
    cards: [["Was bedeutet die Antwort 429 der Archiv-API?", "Das Limit von 600 Anfragen pro Minute und Client ist erreicht; Retry-After sagt, wann es weitergeht."]],
  },
  {
    id: "nw-release",
    title: "Release-Freigabe der Archiv-API",
    paths: { organisation: org("Plattform", "Team Föhn", "Arbeitsweise"), produkte: prod("Übergreifend", "Arbeitsweise", "Team Föhn") },
    cards: [["Wer gibt eine neue Version der Archiv-API frei?", "Der Product Owner – nach grünem Vertragstest gegen alle bekannten Konsumenten."]],
  },
  {
    id: "nw-ts-desktop",
    title: "Troubleshooting Desktop-Client",
    paths: { organisation: org("Clients", "Team Passat", "Betrieb"), produkte: prod("Dokumentenplattform", "Desktop-Client", "Betrieb") },
    cards: [
      ["Was tust du bei einem Sync-Konflikt im Desktop-Client?", "Beide Fassungen bleiben erhalten; im Konfliktdialog wählst du, welche gilt – die andere wird Version."],
      ["Wann setzt du den lokalen Cache zurück?", "Wenn Dokumente veraltet erscheinen, obwohl der Server neuer ist: Einstellungen › Cache leeren."],
    ],
  },
  {
    id: "nw-offline",
    title: "Offline-Modus des Desktop-Clients",
    paths: { organisation: org("Clients", "Team Passat", "Sync"), produkte: prod("Dokumentenplattform", "Desktop-Client", "Sync") },
    cards: [["Was geht im Offline-Modus, was nicht?", "Markierte Dokumente lesen und bearbeiten geht; Suche über das ganze Archiv und neue Ablagen nicht."]],
  },
  {
    id: "nw-scanner",
    title: "Scanner einbinden",
    paths: { organisation: org("Clients", "Team Passat", "Erfassung"), produkte: prod("Dokumentenplattform", "Desktop-Client", "Erfassung") },
    cards: [["Wie bindet der Desktop-Client Scanner an?", "Lokal über TWAIN oder WIA; Netzwerkscanner liefern in einen überwachten Ordner."]],
  },
  {
    id: "nw-kanban-passat",
    title: "Kanban bei Team Passat",
    paths: { organisation: org("Clients", "Team Passat", "Arbeitsweise"), produkte: prod("Übergreifend", "Arbeitsweise", "Team Passat") },
    cards: [["Welches WIP-Limit hat „In Arbeit“ bei Team Passat?", "Drei Tickets – ein neues beginnt erst, wenn eines fertig ist."]],
  },
  {
    id: "nw-ts-web",
    title: "Troubleshooting Web-App",
    paths: { organisation: org("Clients", "Team Mistral", "Betrieb"), produkte: prod("Dokumentenplattform", "Web-App", "Betrieb") },
    cards: [["Was prüfst du zuerst, wenn die Web-App leer bleibt?", "Die Browser-Konsole auf Fehler – und ob die Sitzung abgelaufen ist (nach 30 Minuten)."]],
  },
  {
    id: "nw-web-rechte",
    title: "Rollen und Rechte in der Web-App",
    paths: { organisation: org("Clients", "Team Mistral", "Berechtigungen"), produkte: prod("Dokumentenplattform", "Web-App", "Berechtigungen") },
    cards: [["Was darf die Rolle „Leser“ in der Web-App?", "Suchen, ansehen, herunterladen – nicht ändern, löschen oder freigeben."]],
  },
  {
    id: "nw-web-laden",
    title: "Dokumente über die Archiv-API laden",
    paths: { organisation: org("Clients", "Team Mistral", "Datenzugriff"), produkte: prod("Dokumentenplattform", "Web-App", "Datenzugriff") },
    cards: [["Warum lädt die Web-App Vorschaubilder einzeln nach?", "Die Archiv-API liefert Listen ohne Vorschau; jede Vorschau ist ein eigener Aufruf, damit die Liste schnell erscheint."]],
  },
  {
    id: "nw-ts-connector",
    title: "Troubleshooting Connector-Hub",
    paths: { organisation: org("Integration", "Team Zephyr", "Betrieb"), produkte: prod("Integration", "Connector-Hub", "Betrieb") },
    cards: [["Wo landen Nachrichten, die ein Connector nicht zustellen kann?", "In der Dead-Letter-Queue; nach der Behebung der Ursache werden sie erneut eingespielt."]],
  },
  {
    id: "nw-erp",
    title: "ERP-Connector konfigurieren",
    paths: { organisation: org("Integration", "Team Zephyr", "Connectoren"), produkte: prod("Integration", "Connector-Hub", "Connectoren") },
    cards: [["Welche Felder braucht der ERP-Connector mindestens?", "Belegnummer, Belegdatum und Geschäftspartner – daraus bildet er die Ablage im Archiv."]],
  },
  {
    id: "nw-scrum-boreas",
    title: "Scrum bei Team Boreas",
    paths: { organisation: org("Plattform", "Team Boreas", "Arbeitsweise"), produkte: prod("Übergreifend", "Arbeitsweise", "Team Boreas") },
    cards: [
      ["Wie lang ist ein Sprint bei Team Boreas, und wann ist das Review?", "Zwei Wochen; das Review ist am zweiten Donnerstag um 14 Uhr und offen für alle Teams."],
      ["Wer zieht bei Team Boreas neue Tickets in den laufenden Sprint?", "Nur die Developers selbst – nach Absprache mit dem Product Owner, wenn das Sprintziel nicht leidet."],
    ],
  },
  {
    id: "nw-dod-boreas",
    title: "Definition of Done bei Team Boreas",
    paths: { organisation: org("Plattform", "Team Boreas", "Arbeitsweise"), produkte: prod("Übergreifend", "Arbeitsweise", "Team Boreas") },
    cards: [["Was gehört bei Team Boreas zur Definition of Done?", "Review durch zwei Personen, Tests grün, Health-Endpunkt erweitert, Betriebshandbuch aktualisiert."]],
  },
];

export const FIRMA_THREADS: SampleThread[] = [
  { a: "nw-api", b: "nw-web-laden", kind: "schnittstelle", note: "Die Web-App liest Dokumente über die Archiv-API." },
  { a: "nw-api", b: "nw-erp", kind: "schnittstelle", note: "Der ERP-Connector legt Belege über die Archiv-API ab." },
  { a: "nw-api", b: "nw-offline", kind: "schnittstelle", note: "Der Desktop-Client synchronisiert über die Archiv-API." },
  { a: "nw-api", b: "nw-index", kind: "nutzt", note: "Suchanfragen der API gehen an den Suchindex des Archiv-Servers." },
  { a: "nw-api", b: "nw-speicher", kind: "nutzt", note: "Die API liest und schreibt über die Speicherklassen des Archiv-Servers." },
  { a: "nw-scrum-boreas", b: "nw-dod-boreas", kind: "voraussetzung", note: "Die Definition of Done ist Teil des Scrum von Team Boreas." },
  { a: "nw-ts-server", b: "nw-ts-desktop", kind: "verbindung", note: "Gleicher Name, anderes Wissen: Server-Log hier, Sync-Konflikt dort." },
  // Across planets: team knowledge stands on world knowledge (stored here, on the company side).
  { a: "sw-scrum", b: "nw-scrum-boreas", kind: "voraussetzung", note: "Team Boreas passt das Scrum-Framework an." },
  { a: "sw-scrum", b: "nw-dod-boreas", kind: "voraussetzung", note: "Die Definition of Done ist eine Scrum-Verpflichtung." },
  { a: "sw-kanban", b: "nw-kanban-passat", kind: "voraussetzung", note: "Team Passat arbeitet mit Kanban – mit eigenem WIP-Limit." },
  { a: "sw-rest", b: "nw-api", kind: "voraussetzung", note: "Die Archiv-API ist eine REST-Schnittstelle." },
  { a: "sw-http", b: "nw-api-limits", kind: "voraussetzung", note: "429 ist ein HTTP-Statuscode." },
  { a: "sw-oauth", b: "nw-api-auth", kind: "voraussetzung", note: "Die Anmeldung nutzt OAuth 2.0 Client Credentials." },
  { a: "sw-log", b: "nw-ts-server", kind: "voraussetzung", note: "Das Server-Log folgt den üblichen Log-Leveln." },
];

/** Where the learner's own work sits — the map opens there. */
export const FIRMA_HOME = { organisation: ["Plattform", "Team Boreas"], produkte: ["Dokumentenplattform", "Archiv-Server"] };

// ── Privat ──────────────────────────────────────────────────────────────────

export const PRIVAT_HUES: Record<string, number> = { "Familie & Freunde": 350, Hobbys: 118, Alltag: 196 };

export const PRIVAT_UNITS: SampleUnit[] = [
  {
    id: "pv-geb-ilse",
    title: "Geburtstag von Oma Ilse",
    paths: { leben: ["Familie & Freunde", "Geburtstage"] },
    cards: [["Wann hat Oma Ilse Geburtstag?", "Am 14. März."]],
  },
  {
    id: "pv-geb-jonas",
    title: "Geburtstag von Jonas",
    paths: { leben: ["Familie & Freunde", "Geburtstage"] },
    cards: [["Wann hat Jonas Geburtstag – und was freut ihn?", "Am 2. August; er sammelt Eisenbahn-Postkarten."]],
  },
  {
    id: "pv-praxis",
    title: "Hausarztpraxis",
    paths: { leben: ["Familie & Freunde", "Kontakte"] },
    cards: [["Wie erreichst du die Hausarztpraxis am schnellsten?", "Telefon 0821 555 0142, vormittags."]],
  },
  {
    id: "pv-akkorde",
    title: "Gitarre: G, C und D",
    paths: { leben: ["Hobbys", "Gitarre"] },
    cards: [["Welche drei Akkorde reichen für viele Lieder in G-Dur?", "G, C und D – die Stufen I, IV und V."]],
  },
  {
    id: "pv-pizza",
    title: "Pizzateig",
    paths: { leben: ["Hobbys", "Kochen"] },
    cards: [["Wie lange muss der Pizzateig mindestens gehen?", "Eine Stunde warm – besser über Nacht im Kühlschrank."]],
  },
  {
    id: "pv-budget",
    title: "Haushaltsbudget",
    paths: { leben: ["Alltag", "Geld"] },
    cards: [["Wie viel bleibt von 50 € Taschengeld, wenn du 30 % sparst?", "35 € – 70 % von 50 €."]],
  },
  {
    id: "pv-muell",
    title: "Müllabfuhr",
    paths: { leben: ["Alltag", "Wohnung"] },
    cards: [["Wann wird die Biotonne abgeholt?", "Jeden zweiten Dienstag, in ungeraden Kalenderwochen."]],
  },
];

export const PRIVAT_THREADS: SampleThread[] = [
  { a: "prozentrechnung-grundbegriffe-formel-dreisatz", b: "pv-budget", kind: "voraussetzung", note: "Sparen ist Prozentrechnung." },
];

export const PRIVAT_HOME = { leben: ["Familie & Freunde"] };

// ── Everything the start atlas needs ────────────────────────────────────────

export const START_SAMPLES: StartSamples = {
  worldSoftware: WORLD_SOFTWARE,
  worldThreads: [...WORLD_SOFTWARE_THREADS, ...SAMPLE_THREADS.map((t) => ({ ...t, kind: "verbindung" as const }))],
  firma: { units: FIRMA_UNITS, threads: FIRMA_THREADS, hues: FIRMA_HUES, home: FIRMA_HOME },
  privat: { units: PRIVAT_UNITS, threads: PRIVAT_THREADS, hues: PRIVAT_HUES, home: PRIVAT_HOME },
};
