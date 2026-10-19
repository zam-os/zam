# UML 2.5.1 Studio & Systemdenker-Akademie

Ein eigenständiger, grafischer **UML-2.5.1-Editor** und eine **interaktive Lern-App** (ohne KI, unabhängig von ZAM startbar), die Schritt für Schritt alle wichtigen grafischen Elemente und Verbindungen erklärt, im Editor abprüft und jede gemeisterte Etappe feiert.

## Highlights

- **Sichtbarer Lernpfad mit 6 Etappen & 24 interaktiven Lektionen**:
  1. **Anwendungsfalldiagramm (Use Case)** – Systemgrenze, Akteure, Anwendungsfälle, `«include»` & `«extend»`
  2. **Klassendiagramm (Class)** – Klassen (3 Kompartimente), Sichtbarkeiten (`+`, `-`, `#`, `~`), `«interface»`, Komposition (`◆`), Aggregation (`◇`), Vererbung (`──▷`) & Realisierung (`- - ▷`)
  3. **Aktivitätsdiagramm (Activity)** – Start/Ende (`●` / `◉`), Aktionen, Entscheidungsrauten (`◇`) mit `[Guards]`, Parallelisierung (`Fork/Join ▬`)
  4. **Zustandsdiagramm (State Machine)** – Zustände mit `entry /`, `do /`, `exit /` und Transitionen (`Trigger [Guard] / Effekt`)
  5. **Sequenzdiagramm (Sequence)** – Lebenslinien, synchrone Aufrufe (`──▶`), Antwortnachrichten (`- - >`), asynchrone Signale (`──>`) & kombinierte Fragmente (`alt`, `opt`, `loop`)
  6. **Komponentendiagramm (Component)** – Komponenten (`«component»`), angebotene (Lollipop `○—`) & benötigte Schnittstellen (Socket `)—`), Abhängigkeiten
- **4 Prüfungsformate ohne KI**:
  - Visueller Schnell-Check (Verständnisfrage)
  - Geführtes Zeichnen & Verbinden mit deterministischem Graph-Prüfer und gezieltem Hinweis-Feedback
  - Fehler-Detektiv (Reparatur fehlerhafter Diagramme direkt im Editor)
  - Etappen-Finale (Systemverständnis-Missionen mit Live-Checkliste, Konfetti & Abzeichen-Feier)
- **Freier Editor („Ideen visualisieren“)**:
  - Sofortiger Zugriff auf alle UML-2.5.1-Elemente und alle **14 offiziellen UML-2.5.1-Diagrammtypen**
  - Automatische lokale Speicherung (`localStorage`)
  - Export & Import als `.uml.json`, Bild-Export als `.svg` und `.png`
  - Live-Code-Export nach **PlantUML** (`@startuml ... @enduml`) und **Mermaid**

## Starten & Bauen

```bash
cd uml-learning-app

# Entwicklungsserver starten (http://localhost:5180)
npm run dev

# Typprüfung & Produktions-Build (erzeugt portable Single-File-HTML in dist/index.html)
npm run build

# Automatisierte Tests ausführen
npm test
```
