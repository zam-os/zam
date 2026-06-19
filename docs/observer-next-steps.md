# Observer: Prioritätenliste für nächste Erweiterungen

> Stand: 2026-06-19
>
> Branch: `feat/windows-ui-observer-proposal`
>
> Phase 0 Status: ~90% abgeschlossen

## Aktueller Stand

### Was funktioniert (Phase 0)

- **Screen Capture**: `Windows.Graphics.Capture` mit Resizing-Handling, wiederverwendbarer Staging-Textur
- **UI Automation**: Focus-Polling, Dialog-Erkennung, Toggle/Selection-Änderungen, Invoke-Events (COM-Handler)
- **Raw Input**: Klicks, Scroll, Shortcuts, aggregierte Tastatur-Aktivität (nie Zeichen)
- **Unified Watch**: 3-Thread-Architektur (Capture + UIA + Input) mit MPSC-Kanal, atomarem Privacy-Pause
- **Privacy**: Password-Manager, Banking, Private Browsing; Custom-Policy via JSON
- **Replay Engine**: `UiSensorEvent` → `UiObservationReport` (deterministisch, LLM-frei)
- **Desktop Integration**: Tauri-Commands für Watch-Lifecycle, Observer-Panel, Snapshot-Analyse
- **CI/CD**: x64 + ARM64 Builds
- **Tests**: 56 Rust-Tests + 211 TypeScript-Tests, alle grün
- **Code-Qualität**: Clippy, Biome, TypeScript-Check bestanden

### Was fehlt für Phase 0-Abschluss

Laut Proposal (Zeile 550-552):
1. Persistierte Live-Reports in den Learning-Kernel einspeisen
2. UI Automation um `text-change` und `structure` Events erweitern

---

## Priorität 1: Phase 0 abschließen (1-2 Wochen)

### 1.1 Session-Integration für Live-Reports
**Aufwand**: Mittel | **Impact**: Hoch

`watch --reports` produziert bereits `UiObservationReport`-JSONL. Diese müssen jetzt in eine laufende ZAM-Session fließen:

- `zam bridge observe-ui-watch --session <id>` implementieren
- Reports in Session-JSONL anhängen (wie `observe-ui-snapshot`)
- Session-Synthesis kann Reports als Evidenz nutzen

### 1.2 UIA Text-Change Events
**Aufwand**: Gering | **Impact**: Mittel

UIA `TextChangedEvent` abonnieren (analog zu `InvokeEvent`):
- `IUIAutomationEventHandler` für `UIA_Text_TextChangedEventId`
- Nur Zeichenanzahl erfassen, nie den Text selbst
- Privacy-Gate: Events in Passwort-Feldern verwerfen

### 1.3 UIA Structure-Change Events
**Aufwand**: Gering | **Impact**: Mittel

UIA `StructureChangedEvent` für Baum-Änderungen:
- Neue/geschlossene Child-Elemente melden
- Nützlich für dynamische UIs (z.B. TreeView, ListView)

---

## Priorität 2: Phase 1 — Deterministischer Observer (2-4 Wochen)

### 2.0a Lokaler OCR-Fallback für UIA-Elemente (Agy-P0)
**Aufwand**: Gering | **Impact**: Hoch

Wenn UIA `CurrentName()` leer ist, lokales OCR auf dem Bounding-Rectangle des Elements:
- `Windows.Media.Ocr.OcrEngine` — bereits in `uia.rs` importiert, 100% offline
- `capture_rect_gdi()` + `ocr_bitmap()` sind implementiert — nur noch in `focused_element_from()` integrieren
- Nützlich für: Web-Apps ohne ARIA-Labels, Canvas-basierte UIs, Legacy-Anwendungen
- Keine Netzwerk-Kosten, keine Privacy-Einbußen

> **Status**: `uia.rs:659-673` hat bereits eine Implementierung — prüfen ob sie korrekt funktioniert

### 2.1 Activity-Segmentierung (Action Grouping)
**Aufwand**: Mittel | **Impact**: Hoch

Roh-Events zu sinnvollen Aktionen gruppieren:
- Idle-Erkennung via AFK-Schwellwert (kein Input >30s)
- App-Wechsel als Segment-Grenze
- Dialog-Open/Close als Segment-Grenze
- Lauter Antigravity Review: Heartbeat-basierte AFK-Erkennung elegant integrieren

### 2.2 Event-getriebene Capture-Trigger (Screenpipe + Agy-Pattern)
**Aufwand**: Mittel | **Impact**: Hoch

Aus `MiMo-OpenSource-Research-Proposal.md` + `Agy-OpenSource-Research-Proposal.md`:
- UIA-Events und Input-Events triggern sofortige Keyframe-Erfassung
- Polling-Intervall als Heartbeat-Fallback beibehalten
- `trigger_capture()` ist bereits implementiert — nur noch in UIA-Thread und Input-Thread aufrufen
- `SetWinEventHook` für `EVENT_SYSTEM_FOREGROUND` + `EVENT_OBJECT_FOCUS` bereits in `uia.rs:454-473`
- Reduziert Storage und API-Kosten um ~60-80% (Agy-Schätzung)

### 2.3 Tray-Indicator für aktive Beobachtung
**Aufwand**: Gering | **Impact**: Mittel

Windows-System-Tray-Icon während aktiver `watch`-Session:
- Pausieren/Stoppen über Tray-Menü
- Zeigt an: Session-Name, Event-Zähler, Privacy-Status

### 2.4 Performance-Validierung
**Aufwand**: Gering | **Impact**: Mittel

Acceptance-Criteria aus dem Proposal:
- 30-Minuten-Stabilitätstest ohne Crash
- CPU/Memory-Messung auf x64 und ARM64
- Latenz-Messung für Event-to-Report-Pipeline

---

## Priorität 3: Phase 2 — Vision-Model-Integration (4-8 Wochen)

### 3.1 Provider-neutraler Frame/Clip-Adapter
**Aufwand**: Hoch | **Impact**: Hoch

Interface für multimodale Modelle:
- `analyzeFrames`: Keyframes + Event-Metadata
- `analyzeClip`: kurzes Video + Event-Metadata
- OpenAI-kompatibel als Baseline

### 3.2 Modell-Benchmarking
**Aufwand**: Mittel | **Impact**: Hoch

Eval-Dataset aus dem Proposal:
- File Explorer, Browser-Formular, Windows-Einstellungen
- Metriken: Step-Segmentation F1, Completion-Precision, Error-Recall
- Modelle: MiMo-V2.5, MiMo-VL, Gemini Flash-Lite, Qwen VL

### 3.3 Coordinate Scaling (Anthropic-Pattern)
**Aufwand**: Gering | **Impact**: Mittel

Keyframes auf 1024×768 runterskalieren vor Vision-Request:
- Original-Keyframe nur bei unklarem UIA-Text
- Reduziert Token-Kosten um ~60-70%

### 3.4 Kosten-Kontrolle
**Aufwand**: Mittel | **Impact**: Hoch

- Per-Session-Budget konfigurierbar
- Idle-Perioden: keine Vision-Calls
- Event-getriebene Analyse statt kontinuierlich
- Kosten-Tracking pro Session

---

## Priorität 4: Open-Source-Integrationen (fortlaufend)

### 4.1 PII-Erkennungsmodell (Screenpipe-Pattern)
**Aufwand**: Hoch | **Impact**: Hoch

Phase 1: Regex-basierte PII-Erkennung (E-Mail, IBAN, Kreditkarte)
Phase 2: Kleines ONNX-Modell (<50 MB) für Screenshot-PII

### 4.2 Per-Provider-Privacy-Policy (Screenpipe-Pattern)
**Aufwand**: Mittel | **Impact**: Mittel

YAML/JSON-Konfiguration pro Vision-Provider:
- `local.mimo-vl`: Alles erlaubt
- `cloud.gemini`: Keyframes erlaubt, Window-Titles redacted
- Enforcement in der Bridge-Schicht

### 4.3 Trajectory-Recording-Format (CUA-Pattern)
**Aufwand**: Mittel | **Impact**: Mittel

Standardisiertes Export-Format für Evaluation:
- JSONL + Keyframe-Referenzen
- Kompatibilität mit CUA prüfen
- Ermöglicht A/B-Tests zwischen Modellen

### 4.4 Accessibility-Tree-Tiefe (PyWinAssistant-Pattern)
**Aufwand**: Mittel | **Impact**: Mittel

Nicht nur fokussiertes Element, sondern Children erfassen:
- Toolbar-Buttons, ListView-Items, Menu-Einträge
- UIA-Baum-Tiefe begrenzt (max 3 Level)
- Mehr semantische Daten ohne Vision-Kosten

### 4.5 Sichere UIA-Wrapper-Integration (Agy-P1)
**Aufwand**: Mittel | **Impact**: Mittel

`uiautomation-rs` als sicherer Rust-Wrapper für UIA-COM:
- Eliminiert manuelles Casting von rohen COM-Pointern in `uia.rs`
- Reduziert Risiko von Memory-Leaks und COM-Threading-Fehlern
- Prüfung: Ist der Wrapper reif genug für Production-Use?

### 4.6 OmniParser-kompatibles Grounding-Format (Agy-P2)
**Aufwand**: Gering | **Impact**: Mittel

`UiObservationReport` um optionales `grounding`-Feld erweitern:
- Bounding-Boxes + funktionale Beschreibungen im OmniParser-Format
- ZAM-Aufnahmen direkt als Input für Computer-Use-Agenten nutzbar
- Kompatibilität mit Microsoft OmniParser-Ökosystem

### 4.7 Capture-Library-Migration (Agy-P2)
**Aufwand**: Mittel | **Impact**: Niedrig

Langfristig: Migration von Custom-D3D11-Loop zu etablierter Library:
- `windows-capture` für Windows-only (weniger Wartungsaufwand)
- `CrabGrab` für Cross-Platform (macOS-Support)
- Aktuell: eigener Code ist stabil — Migration nur bei geplantem macOS-Support

---

## Priorität 5: Phase 3+4 — Synthesis & Live Guidance (8+ Wochen)

### 5.1 Watch-Direktiven vom Session-Agent
- Observer erhält erwartete Outcomes + Candidate-Token-Slugs
- Observer bewertet nicht — meldet nur Evidenz

### 5.2 Synthesis-Candidates aus Observer-Reports
- Reports → reviewbare Synthesis-Candidates
- User-Bestätigung vor FSRS-Update

### 5.3 Live-Intervention bei wiederholten Fehlern
- Session-Agent darf eingreifen bei Help-Seeking
- Silent Shadowing als Default

---

## Offene technische Fragen

1. **UIA-Event-Reliabilität**: Wie zuverlässig sind Invoke/TextChanged Events across Apps? Fallback auf Polling?
2. **ARM64-D3D11**: Funktioniert `Windows.Graphics.Capture` identisch auf ARM64?
3. **Multi-Monitor**: Wie verhält sich Capture bei Multi-Monitor-Setup?
4. **Secure Desktop**: UAC-Prompt-Erkennung implementieren?
5. **Audio/Think-Aloud**: WASAPI + whisper.cpp Integration — Wann sinnvoll?
6. **OCR-Fallback-Performance**: Wie schnell ist `OcrEngine` auf einzelnen UI-Elementen? Akzeptabel für Echtzeit-Polling?
7. **`uiautomation-rs`-Reife**: Ist der Wrapper stabil genug für Production? COM-Threading korrekt?

---

## Metriken für Phase 0-Abnahme

| Kriterium | Ziel | Status |
|-----------|------|--------|
| 30-Minuten-Stabilität | Kein Crash | Offen |
| Kein persistierter Text | 0 Leaks | ✅ Implementiert |
| Events im Log | Click, Shortcut, App-Wechsel, Dialog | ✅ Implementiert |
| Schema-valid Reports | Replay erzeugt valide JSONL | ✅ Implementiert |
| CPU-Overhead | <5% bei 1 FPS Sampling | Offen |
| ARM64-Build | CI grün | ✅ Implementiert |

---

## Quellen

- `docs/windows-ui-observer-proposal.md` — Phase 0-4 Delivery Plan
- `docs/MiMo-OpenSource-Research-Proposal.md` — 7 Lernpunkte (Screenpipe, ActivityWatch, PyWinAssistant, CUA, Selfspy, Anthropic CU)
- `docs/Agy-OpenSource-Research-Proposal.md` — 5 Zusatzpunkte (OpenAdapt, ShowUI, OmniParser, Windows APIs, Rust Libraries)
- `antigravity-review.md` — Code-Review mit 4 kritischen Punkten (alle behoben)
