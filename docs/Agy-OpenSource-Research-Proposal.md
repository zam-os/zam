# Agy Open-Source Research Proposal

> ZAM Windows UI Observer — Zusätzliche Lernpunkte aus Open-Source-Projekten und Bibliotheken
>
> Autor: Agy (Antigravity Coding Assistant)  
> Stand: 2026-06-19  
> Kontext: Ergänzung zu `MiMo-OpenSource-Research-Proposal.md`

## Ziel

Dieses Dokument ergänzt die von MiMo durchgeführte Open-Source-Recherche. Es untersucht spezifische Rust-Bibliotheken, native Windows-APIs und moderne Screen-Understanding-Modelle, die ZAM dabei helfen können, die Beobachtung effizienter, robuster und vollständig lokal/privat zu gestalten, ohne das Rad neu erfinden zu müssen.

---

## 1. Ergänzende Open-Source-Projekte & Modelle

Zusätzlich zu den von MiMo genannten Projekten (Screenpipe, ActivityWatch, PyWinAssistant, CUA, Selfspy, Anthropic Computer Use) sind die folgenden Open-Source-Technologien für ZAM von hohem Wert:

### [OpenAdapt](https://github.com/OpenAdaptAI/openadapt-desktop)
- **Kern:** Ein AI-first Desktop-Prozess-Recorder und ML-Adapter für Multi-Modal-Modelle.
- **Lernpunkt:** Nutzt einen modularisierten Ansatz (`openadapt-capture` für die eigentliche Beobachtung und `openadapt-ml` für die Anbindung an VLMs).
- **Nutzen für ZAM:** OpenAdapt demonstriert, wie man time-aligned Screenshots mit Keyboard/Mouse-Events und Accessibility-Tree-Zuständen in einem plattformunabhängigen Format persistiert, das sich ideal für das Training oder Benchmarking von VLMs eignet.

### [ShowUI](https://github.com/showlab/ShowUI)
- **Kern:** Ein extrem leichtgewichtiges Vision-Language-Action (VLA) Modell für GUI-Interaktionen (basierend auf Phi-3.5-Vision).
- **Lernpunkt:** ShowUI-Aloha demonstriert, wie menschliche Demonstrationen aufgenommen und in semantische Action-Traces destilliert werden können.
- **Nutzen für ZAM:** Bietet uns eine Referenz, wie man beobachtete UI-Ereignisse so aufbereitet, dass ein VLA-Modell daraus Interaktionsschritte ableiten kann.

### [Microsoft OmniParser](https://github.com/microsoft/OmniParser)
- **Kern:** Ein Screen-Parsing-Tool, das Screenshots in strukturierte Listen von interaktiven Elementen (mit Bounding Boxes und funktionalen Beschreibungen) umwandelt.
- **Lernpunkt:** Verbessert das visuelle Verständnis von LLMs auf Oberflächen drastisch, insbesondere dort, wo Accessibility-Bäume (UIA) unvollständig sind (z. B. in Canvas-basierten Apps, Spielen, Legacy-Oberflächen).
- **Nutzen für ZAM:** Wenn wir Bounding Boxes und Element-Interaktionsdaten sammeln, können wir das von OmniParser geprägte Format (Element-IDs + Koordinaten) nutzen, um maximale Kompatibilität mit zukünftigen Agenten-Pipelines zu gewährleisten.

---

## 2. Hilfreiche Rust-Bibliotheken & Native Windows APIs

Um den Entwicklungsaufwand im `zam-observer` Rust-Crate zu verringern und die Stabilität zu erhöhen, sollten wir auf bestehende Open-Source-Bibliotheken und native OS-APIs setzen:

### 1. Windows-Native OCR (`Windows.Media.Ocr.OcrEngine`)
- **Konzept:** Windows 10 & 11 bieten eine integrierte, hochperformante OCR-Engine, die direkt über WinRT-APIs angesprochen werden kann.
- **Vorteile für ZAM:** 
  - Läuft zu 100 % lokal und offline (absoluter Schutz der Privatsphäre).
  - Keine externen Binärdateien oder Modellgewichte (wie bei Tesseract oder PaddleOCR) nötig.
  - Extrem ressourcenschonend.
- **Implementierung:** Direkt über das `windows` Crate im Namespace `windows::Media::Ocr::OcrEngine` (oder den Wrapper `win_ocr`).

### 2. Windows Event Hooks (`SetWinEventHook`)
- **Konzept:** Anstelle von Polling können wir uns über OS-level Hooks direkt von Windows benachrichtigen lassen, wenn sich das aktive Fenster oder der UIA-Fokus ändert.
- **Vorteile für ZAM:** 
  - Reduziert die CPU-Last des Observers im Leerlauf auf fast 0 %.
  - Keine verpassten Aktionen mehr zwischen den Polling-Intervallen.
- **Implementierung:** Die Rust-Bibliothek `wineventhook` bietet einen sicheren und idiomatischen Wrapper um diese Win32-APIs.

### 3. Abstraktion des Screen-Captures (`CrabGrab` oder `windows-capture`)
- **Konzept:** Community-gepflegte Capture-Bibliotheken für Rust.
- **Vorteile für ZAM:** 
  - `CrabGrab` bietet eine saubere, plattformübergreifende Schnittstelle (Windows WGC/DXGI & macOS ScreenCaptureKit).
  - `windows-capture` kapselt die komplexe WinRT FramePool-Initialisierung, Frame-Arrived Callbacks und das Handling von Größenänderungen.
- **Nutzen für ZAM:** Ersetzt unseren handgeschriebenen Capture-Loop und macht das Handling von Resizing und API-Fehlern robuster.

### 4. Ergonomische UIA-Schnittstelle (`uiautomation-rs`)
- **Konzept:** Ein sicherer, ergonomischer Rust-Wrapper für die COM-basierten UI Automation Client-Schnittstellen.
- **Vorteile für ZAM:** 
  - Macht das manuelle Casten von raw COM-Pointern und `IUnknown`-Objekten in `uia.rs` überflüssig.
  - Reduziert das Risiko von Speicherlecks oder COM-Thread-Fehlern.

---

## 3. Konkreter Umsetzungsvorschlag für ZAM

Basierend auf den Erkenntnissen schlage ich folgende Integrationsschritte in der nächsten Phase vor:

### Schritt 1: Event-getriebener Trigger-Loop via `wineventhook`
Wir ergänzen den Observer um einen globalen Event-Listener. Bei Eintritt von Events wie `EVENT_SYSTEM_FOREGROUND` oder `EVENT_OBJECT_FOCUS` triggern wir sofort eine Erfassung des UIA-Fokus und ein Keyframe-Capture. Das Polling-Intervall wird zu einem langsamen "Fallback-Heartbeat" (z. B. alle 5 Sekunden) hochgesetzt.
- **Erwarteter Impact:** Reduzierung der CPU-Last und des Speicherbedarfs um ca. 60-80% bei gleichzeitiger Erhöhung der zeitlichen Präzision.

### Schritt 2: Lokales Windows-Native OCR Fallback
Wenn bei einem fokussierten Element der UIA-Name fehlt oder leer ist, führt ZAM eine lokale OCR auf dem Bildbereich des Elements durch.
- **Erwarteter Impact:** Bessere Datenqualität bei Custom-UIs (z. B. Web-Apps im Browser ohne korrekte ARIA-Labels) ohne Privatsphäre-Einbußen oder Netzwerk-Kosten.

### Schritt 3: Migration auf eine etablierte Capture-Bibliothek
Sobald Cross-Platform-Unterstützung (macOS) in ZAM geplant wird, migrieren wir den Capture-Teil auf `CrabGrab`. Für Windows-only Stabilität nutzen wir alternativ `windows-capture`, um den Wartungsaufwand unseres Direct3D-Loops zu minimieren.

### Schritt 4: UI-Grounding-Export im OmniParser-Stil
Wir erweitern den `UiObservationReport` um ein optionales `grounding`-Feld, das Bounding Boxes und funktionale Beschreibungen im standardisierten OmniParser-Format speichert.
- **Erwarteter Impact:** ZAM-Aufzeichnungen können ohne Vorbearbeitung direkt als Eingabe für moderne Computer-Use-Agenten verwendet werden.

---

## Priorisierte Roadmap

| Prio | Task | Aufwand | Impact | Bibliothek / API |
|------|------|---------|--------|------------------|
| **P0** | Integration von Windows Event Hooks | Gering | Hoch | `wineventhook` |
| **P0** | Lokale OCR für unbenannte Elemente | Gering | Hoch | `Windows.Media.Ocr` |
| **P1** | Refactoring `uia.rs` mit sicherem Wrapper | Mittel | Mittel | `uiautomation-rs` |
| **P2** | Standardisierung des Grounding-Exports | Gering | Mittel | OmniParser Schema |
| **P2** | Migration des Capture-Loops | Mittel | Gering | `windows-capture` / `CrabGrab` |
