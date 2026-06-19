# MiMo Open-Source Research Proposal

> ZAM Windows UI Observer — Lernpunkte aus vergleichbaren Open-Source-Projekten
>
> Stand: 2026-06-19
>
> Baseline: Branch `feat/windows-ui-observer-proposal`, Phase 0

## Ziel

ZAMs Windows UI Observer ist ein einzigartiges System, aber mehrere Open-Source-Projekte lösen Teilprobleme bereits. Dieses Proposal dokumentiert, was wir von ihnen lernen können, und priorisiert die Integration in die nächste Entwicklungsphase.

## Relevante Projekte

| Projekt | Stars | Sprache | Kernproblem |
|---------|-------|---------|-------------|
| [Screenpipe](https://github.com/screenpipe/screenpipe) | 19.4k | Rust + TS | Screen Capture + Accessibility Tree + AI |
| [ActivityWatch](https://github.com/ActivityWatch/activitywatch) | 17.9k | Python + Rust | Activity Tracking + Event-Buckets |
| [PyWinAssistant](https://github.com/a-real-ai/pywinassistant) | 1.3k | Python | UIA-first GUI-Wahrnehmung |
| [CUA (trycua)](https://github.com/trycua/cua) | 18.5k | Rust + Python | Computer-Use-Agent + Trajectory Recording |
| [Selfspy](https://github.com/selfspy/selfspy) | 2.5k | Python | Input-Monitoring + Encrypted-at-rest |
| [Anthropic Computer Use](https://github.com/anthropics/claude-quickstarts/tree/main/computer-use-demo) | 17.1k | Python | Screenshot → Vision-Model-Pipeline |

## Empfohlene Lernpunkte

### 1. Event-getriebene Capture-Trigger (von Screenpipe)

**Problem:** ZAM pollt aktuell in festen Intervallen (`--interval-ms`). Das erzeugt Traffic bei Stabilität und verpasst schnelle Aktionen zwischen den Samples.

**Screenpipe-Lösung:** Lauscht auf OS-Events (App-Wechsel, Klick, Tastaturpause, Scroll, Clipboard). Screenshot + Accessibility-Tree werden zusammen erfasst, wenn etwas Bedeutendes passiert.

**Vorschlag für ZAM:**

- `watch-window` um einen Event-Modus ergänzen: UIA-Events und Raw-Input-Events triggern sofortige Keyframe-Erfassung
- Polling-Intervall als Fallback/Heartbeat beibehalten, aber primäre Erfassung wird event-getrieben
- Reduziert Storage von ~2 GB/8h auf ~300 MB/8h (Screenpipe-Messung)

```rust
// Pseudo-Design
enum CaptureTrigger {
    PollHeartbeat(Duration),          // bestehend: regelmäßiger Heartbeat
    UiaFocusChange(ElementInfo),      // neu: UIA-Event als Trigger
    RawInputAction(InputEvent),       // neu: Klick/Shortcut als Trigger
    WindowContextChange(HWND),        // neu: App-Wechsel als Trigger
}
```

### 2. Accessibility Tree als primäre Datenquelle (von Screenpipe + PyWinAssistant)

**Problem:** ZAM nutzt UIA nur für den fokussierten Element-Poll (`watch-uia`). Die meisten Informationen über "was passiert" stecken im UIA-Baum, nicht in Pixeln.

**Screenpipe-Lösung:** Accessibility Tree ist die primäre Datenquelle — schneller, genauer, weniger CPU als OCR/Vision. Pixels nur als Fallback.

**PyWinAssistant-Lösung:** Hierarchische UIA-Baumnavigation für räumliches Verständnis ohne Screenshots. Self-Healing-Selektoren passen sich automatisch an UI-Änderungen an.

**Vorschlag für ZAM:**

- UIA-Baum-Tiefe ausnutzen: nicht nur fokussiertes Element, sondern Children erfassen (z.B. Toolbar-Buttons, ListView-Items)
- UIA-Events für `InvokePattern`, `SelectionPattern`, `TogglePattern`, `ValuePattern` abonnieren — nicht nur `FocusChanged`
- Accessibility-Text als primären Evidence-Typ in `UiObservationReport` einführen (neben `keyframe`)
- Vision-Modell nur bei unklarem UIA-Text oder custom-rendered Apps einsetzen

### 3. PII-Erkennungsmodell (von Screenpipe)

**Problem:** ZAMs Privacy-Filter ist regelbasiert (Prozessname, Titel-Marker). Gut für Password-Manager, aber erkennt z.B. keine E-Mail-Adressen oder Namen in normalen Anwendungen nicht.

**Screenpipe-Lösung:** Eigenes PII-Erkennungsmodell, läuft in 9ms auf Consumer-Hardware. Erkennt personenbezogene Daten in Screenshots vor dem Senden an Cloud-Modelle.

**Vorschlag für ZAM:**

- Phase 1: Regelbasierte PII-Erkennung im Observer (E-Mail-Patterns, IBAN, Kreditkartennummern) als Text-Redaktion vor Vision-Request
- Phase 2: Kleines lokales Modell (ONNX Runtime, <50 MB) für PII-Erkennung in Keyframes
- Integration in die bestehende Privacy-Pipeline vor `observe-ui-snapshot`

### 4. Heartbeat-basierte AFK-Erkennung (von ActivityWatch)

**Problem:** ZAM erkennt Inaktivität nur über fehlende Keyframe-Änderungen. Keine explizite AFK-Erkennung.

**ActivityWatch-Lösung:** Watcher senden periodische Heartbeats an den Server. Kein Heartbeat innerhalb des Thresholds → Benutzer ist AFK. Elegant und zuverlässig.

**Vorschlag für ZAM:**

- Bestehenden `heartbeat`-Event-Typ in `UiSensorEvent` als AFK-Signal nutzen
- Wenn kein Input-Event (Raw Input) für >N Sekunden: Status `afk` in Observation Report
- AFK-Perioden in Reports als `idle` markieren, nicht als `progress`
- Session-Agent kann AFK-Phasen für Zeitberechnungen nutzen

### 5. Trajectory-Recording-Format (von CUA)

**Problem:** ZAMs Replay-Engine replays `UiSensorEvent` → `UiObservationReport`. Es gibt kein standardisiertes Format für "Trajectories" (Sequenzen von User-Actions + Screenshots + Context).

**CUA-Lösung:** Trajectory Recording speichert Agent-Actions für Training/Evaluation. Standardisiertes Format für Replay und Benchmarking.

**Vorschlag für ZAM:**

- `UiObservationReport`-Sequenzen als Trajectory exportieren (JSONL + Keyframe-Referenzen)
- Trajectory-Format für das Evaluation Dataset im Proposal definieren
- Replay-Engine erweitern: Trajectory → vergleichbare Reports für Modell-Benchmarking
- Ermöglicht A/B-Tests zwischen verschiedenen Vision-Modellen auf denselben Trajectories

### 6. Coordinate Scaling für Vision-Modelle (von Anthropic Computer Use)

**Problem:** Screenshots in Originalauflösung (z.B. 1920×1080) sind teuer als Vision-Input. Modelle brauchen nicht die volle Auflösung.

**Anthropic-Lösung:** Bild auf XGA (1024×768) runterskalieren, Modell interagiert mit skalierten Koordinaten, Map zurück auf Originalauflösung.

**Vorschlag für ZAM:**

- Keyframes standardmäßig auf 1024×768 oder 1280×720 runterskalieren vor Vision-Request
- Original-Keyframe nur bei Bedarf senden (z.B. für Text-Crop bei unklarem UIA-Text)
- Koordinaten-Scaling im `observe-ui-snapshot` implementieren
- Reduziert Token-Kosten um ~60-70% bei vergleichbarer Qualität

### 7. Per-Agent-Datenberechtigungen (von Screenpipe)

**Problem:** ZAM hat eine globale Privacy-Policy. Keine feingranulare Steuerung, welche AI-Modelle welche Daten sehen dürfen.

**Screenpipe-Lösung:** Per-Pipe YAML-Datenberechtigungen mit drei Enforcement-Layern: Skill Gating, Agent Interception, Server Middleware mit kryptographischen Tokens.

**Vorschlag für ZAM:**

- Privacy-Policy um Per-Provider-Regeln erweitern:
  - `cloudProviders.gemini`: Keyframes erlaubt, UIA-Text verboten
  - `local.mimo-vl`: Alles erlaubt
  - `cloudProviders.openai`: Keyframes erlaubt, Window-Titles redacted
- Enforcement in der Bridge-Schicht vor `observe-ui-snapshot`
- Audit-Log: welcher Provider welche Daten erhalten hat

## ZAMs einzigartige Stärken (nicht in anderen Projekten)

Diese Features differenzieren ZAM und sollten bewusst gepflegt werden:

1. **Luminance-basierte Change Detection** — effizientere Keyframe-Retention als Screenpipe's event-getriebener Ansatz (beide haben Wert, Kombination ideal)
2. **Raw Input Monitoring** (Win32 API) — direkter als OS-Events, erfasst Keyboard-Shortcuts ohne Tasteninhalte
3. **Explizite Privacy-Pauses** — Password-Manager, Banking, Private Browsing als harte Stops, nicht nur Filter
4. **Strukturierte Observation Reports** — `UiObservationReport` mit Actions, Evidence, Candidate Tokens
5. **Deterministische Replay-Engine** — Sensor-Events → Reports ohne LLM-Abhängigkeit
6. **FSRS-Integration** — Beobachtungen fließen direkt in Spaced-Repetition-Systematik ein

## Priorisierte Umsetzung

| Priorität | Lernpunkt | Aufwand | Impact |
|-----------|-----------|---------|--------|
| P0 | Event-getriebene Capture-Trigger | Mittel | Hoch — reduziert Kosten und verbessert Erfassung |
| P0 | UIA-Baum-Tiefe ausnutzen | Gering | Hoch — mehr semantische Daten ohne Vision-Kosten |
| P1 | Heartbeat-basierte AFK-Erkennung | Gering | Mittel — sauberere Reports |
| P1 | Coordinate Scaling für Vision | Gering | Mittel — reduziert Token-Kosten |
| P2 | Trajectory-Recording-Format | Mittel | Mittel — Evaluation/Benchmarking |
| P2 | Per-Provider-Privacy-Policy | Mittel | Mittel — feinere Datenschutzkontrolle |
| P3 | Lokales PII-Erkennungsmodell | Hoch | Hoch — stärkste Privacy-Garantie |
## Zusätzliche Bibliotheken & Native Windows APIs (ZAM-spezifische Erweiterung)

Um die in den Lernpunkten beschriebene Architektur nicht komplett von Grund auf neu entwickeln zu müssen, können wir auf folgende Bibliotheken und OS-nahe APIs zurückgreifen:

### 1. Windows-Native OCR (`Windows.Media.Ocr.OcrEngine`)
- **Konzept:** Anstatt schwere externe OCR-Engines (wie Tesseract) oder Cloud-LLMs für Textabschnitte zu nutzen, greifen wir direkt auf die in Windows 10/11 integrierte OCR-Engine über die `windows` Crate zu.
- **Vorteile:** Läuft 100 % lokal, ohne Netzwerk-Verkehr, extrem performant, datenschutzfreundlich und erfordert keine zusätzlichen Modell-Gewichte in ZAM.
- **Verwendung:** Über die WinRT-Namespaces `windows::Media::Ocr::OcrEngine` und `windows::Graphics::Imaging::SoftwareBitmap` (oder Wrapper wie `win_ocr`).

### 2. Windows Event Hooks (`SetWinEventHook`)
- **Konzept:** OS-level Hooks, um Benachrichtigungen bei UI-Änderungen direkt von Windows zu erhalten (z. B. Fokuswechsel, Werteänderung, App-Vordergrund-Wechsel).
- **Vorteile:** Macht Polling überflüssig (reduziert CPU-Last auf nahezu Null im Leerlauf) und ermöglicht sofortige Erfassung bei Benutzeraktionen.
- **Bibliothek:** `wineventhook` Crate in Rust.

### 3. Hochperformantes Capture (`windows-capture`)
- **Konzept:** Eine schlanke, optimierte Rust-Bibliothek für das Windows Graphics Capture API.
- **Vorteile:** Löst das Lifecycle-Management der WinRT Frame-Pools und Direct3D11-Initialisierung robuster ab als unser handgeschriebener Loop.

### 4. Idiomatisches UI Automation (`uiautomation-rs`)
- **Konzept:** Ein sicherer, ergonomischer Rust-Wrapper um die COM-basierten Windows UI Automation Schnittstellen.
- **Vorteile:** Erspart uns das manuelle Casten von raw COM-Pointern und macht die UIA-Codebasis in `uia.rs` deutlich wartungsfreundlicher.

---

## Offene Fragen

1. Soll event-getriebene Capture die Polling-Intervalle vollständig ersetzen oder als zusätzliches Trigger-System arbeiten?
2. Welche UIA-Patterns (Invoke, Selection, Toggle, Value) sind für die meisten Windows-Anwendungen zuverlässig?
3. Ist ein lokales PII-Modell (ONNX, <50 MB) auf ARM64-Laptops in <10ms ausführbar?
4. Soll das Trajectory-Format kompatibel mit CUA's Recording-Format sein?

## Referenzen

- Screenpipe Event-Driven Capture: https://github.com/screenpipe/screenpipe
- ActivityWatch Bucket-Model: https://github.com/ActivityWatch/activitywatch
- PyWinAssistant UIA-First: https://github.com/a-real-ai/pywinassistant
- CUA Trajectory Recording: https://github.com/trycua/cua
- Anthropic Coordinate Scaling: https://github.com/anthropics/claude-quickstarts/tree/main/computer-use-demo
- Selfspy `--no-text` Pattern: https://github.com/selfspy/selfspy
