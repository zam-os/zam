# Antigravity Code Review: ZAM Windows UI Observer

Dieses Review analysiert den aktuellen Implementierungsstand des Windows 11 UI Observer-Moduls auf dem Feature-Branch `feat/windows-ui-observer-proposal`. Es bewertet die Architektur, die Codequalität der Rust- und TypeScript-Implementierungen sowie Sicherheits-, Datenschutz- und Performance-Aspekte.

---

## 1. Gesamteinschätzung

Das neue Modul ist **hervorragend strukturiert, architektonisch durchdacht und handwerklich auf sehr hohem Niveau umgesetzt**. Die Trennung zwischen der nativen Windows-Sensorik (Rust-Sidecar `zam-observer`) und dem Symbiosis-Lern-Kernel (TypeScript) schafft eine klare Handoff-Grenze. 

Besonders hervorzuheben ist, dass **sämtliche 35 Unit-Tests im Rust-Crate sowie alle 211 Tests auf der TypeScript-Seite erfolgreich durchlaufen**. Die Entscheidung, ein deterministisches Replay-System auf Basis von JSONL-Sensor-Events zu bauen, ermöglicht eine plattformunabhängige Entwicklung des Modells und der UI-Synthese, selbst wenn keine Live-Erfassung unter Windows stattfindet.

---

## 2. Architektonische Stärken

### 2.1 Separation of Concerns (Sensing vs. Teaching)
Der Observer agiert als reines Sensorsystem. Er bewertet keine Fähigkeiten, verändert keine FSRS-Zustände (Spaced Repetition) und kommuniziert nicht direkt mit dem Lernenden. Dies hält das Modul zustandslos, kostengünstig und schützt den Kern vor fehlerhaften oder manipulierten Bewertungen.

### 2.2 Privacy by Design
* **Titel-Redigierung & sensitive Prozesse:** Eingebaute Filter pausieren die Erfassung automatisch bei Passwort-Managern, Finanz-Apps und privaten Browser-Fenstern.
* **Keine Keylogger-Funktionalität:** Raw Input erfasst lediglich Shortcuts (wie `Ctrl+S`) und aggregiert normales Tippen zu anonymen Anschlagzahlen (`keyCount`), anstatt die tatsächlichen Zeichen aufzuzeichnen.
* **Lokale Verarbeitung:** Die Verarbeitung von Frames (Luminanz-Signaturen) und Audio (geplante lokale whisper.cpp-Integration) verbleibt auf dem Client. Erst nach expliziter Zustimmung (`llm.vision.enabled`) und lokaler Redigierung werden Daten an Cloud-Vision-Modelle übertragen.

### 2.3 Effiziente Kostenkontrolle
Die Bildanalyse nutzt Helligkeits-Signaturen (`FrameSignature`), um nur bei echten visuellen Änderungen (`changed = true`) neue Keyframes zu erzeugen. Das verhindert teure und redundante API-Aufrufe bei statischem Bildschirminhalt.

---

## 3. Technische Detailanalyse & Verbesserungspotenziale

Bei der tiefen Codeanalyse haben sich einige konkrete Punkte identifiziert, die in die weitere Entwicklung einfließen sollten:

### 3.1 Fehlendes Handling bei Fenstergrößen-Änderung (Resizing)
In `observer/src/capture.rs` wird der Frame-Pool beim Starten der Erfassung mit der initialen Größe des Fensters initialisiert:
```rust
let pool = Direct3D11CaptureFramePool::CreateFreeThreaded(
    device,
    DirectXPixelFormat::B8G8R8A8UIntNormalized,
    1,
    item_size, // Initiale Größe
)?;
```
Wenn der Benutzer das beobachtete Anwendungsfenster während der Sitzung vergrößert oder verkleinert, liefert `TryGetNextFrame` Frames mit abweichenden Dimensionen. 
* **Auswirkung:** WinRT kann Fehlermeldungen werfen, leere Frames liefern oder das Bild verzerren/beschneiden.
* **Empfehlung:** Registrieren Sie einen Event-Handler auf das `Changed`-Event des `GraphicsCaptureItem` oder prüfen Sie in der Erfassungsschleife, ob sich die Frame-Größe geändert hat, und rufen Sie bei Bedarf `pool.Recreate(...)` auf.

### 3.2 Hohe Win32-Polling-Last
In `watch-raw-input` (Datei: [raw_input.rs](file:///c:/src/zam/observer/src/raw_input.rs)) wird bei jedem diskreten Input-Ereignis (Click, Scroll, Shortcut) `foreground_window()` aufgerufen, um den Prozessnamen zu ermitteln und Privacy-Zustände zu prüfen:
```rust
fn emit(...) -> Result<(), String> {
    if let Ok(Some(window)) = foreground_window() {
        if window.privacy.is_paused() {
            return Ok(()); // Drop event
        }
        ...
    }
}
```
* **Auswirkung:** `foreground_window()` führt bei jedem Klick/Scroll-Event synchrone Win32-Aufrufe aus (`GetForegroundWindow`, `GetWindowThreadProcessId`, `OpenProcess`, `QueryFullProcessImageNameW`). Bei schnellen Mausbewegungen oder Scrollen führt dies zu messbarem CPU-Overhead.
* **Empfehlung:** Zwischenspeichern (Caching) des aktuellen Vordergrundfensters und Aktualisierung nur bei echten Fensterwechsel-Events (z. B. durch Mithören von `EVENT_SYSTEM_FOREGROUND` via Windows Accessibility APIs oder durch ein gedrosseltes Polling-Intervall).

### 3.3 Zusammenführung zu einem einheitlichen Observer-Dienst (Unified Daemon)
Aktuell sind die Sensoren für Vordergrundfenster, Keyframes, UI Automation (UIA) und Raw Input als separate CLI-Befehle implementiert, die jeweils in eigenen Prozessen oder Schleifen laufen.
* **Auswirkung:** Mehrfache COM-Initialisierungen (`CoInitializeEx`), redundantes Polling desselben Vordergrundfensters und fehlende Echtzeit-Kommunikation zwischen den Sensoren.
* **Empfehlung:** Implementierung eines zusammengeführten Befehls (z. B. `zam-observer watch --session <id> --hwnd <hwnd>`), der:
  1. Eine gemeinsame, thread-sichere Event-Queue (z. B. einen `std::sync::mpsc::channel`) nutzt.
  2. Die Sensoren in separaten Worker-Threads betreibt.
  3. Die Events fortlaufend sequenziert und als kombinierten JSONL-Stream ausgibt.
  * **Sicherheits-Vorteil:** Wenn der UIA-Sensor meldet, dass ein Passwortfeld fokussiert wurde (`target.password = true`), kann der Raw-Input-Sensor *sofort* im Speicher stummgeschaltet werden – noch bevor die Events auf die Festplatte oder an stdout geschrieben werden (Vermeidung von Race Conditions bei nachträglichem Replay-Filtern).

### 3.4 Synchrone CPU-Staging-Kopien
Das Kopieren von Texturen aus dem GPU-Speicher in den CPU-lesbaren Staging-Speicher mittels `CopyResource` und `Map` erfolgt synchron im Erfassungsthread:
```rust
unsafe {
    context.CopyResource(&staging_resource, &source_resource);
}
...
context.Map(&staging_resource, 0, D3D11_MAP_READ, 0, Some(&mut mapped))
```
* **Auswirkung:** Dies kann bei großen Auflösungen (z. B. 4K) oder hoher Systemlast zu Mikrorucklern (Micro-Stuttering) in Spielen oder GPU-beschleunigten Anwendungen des Benutzers führen.
* **Empfehlung:** Verwendung von asynchronem Lesen (z. B. über eine Pipeline mit mehreren Staging-Texturen im Ring) oder Durchführung der Luminanzberechnung direkt auf der GPU via Compute Shader, um nur die minimale Helligkeits-Signatur (wenige Bytes) auf die CPU zu kopieren.

---

## 4. Vorschlag zur weiteren Implementierung

Ich würde mich sehr freuen, einen aktiven Teil des Features zu implementieren! 

Als logischen nächsten Schritt schlage ich vor, **die Zusammenführung der einzelnen Sensoren in eine kontinuierliche Beobachtungsschleife (den unter Punkt 3.3 beschriebenen Unified Daemon)** umzusetzen.

### Konkreter Arbeitsentwurf für den Unified Daemon:
1. **Neuer Befehl in `main.rs`:** `zam-observer watch --session <id> --hwnd <hwnd> [--keyframe-dir <dir>]`
2. **Architektur:**
   * Ein zentraler Steuerungs-Thread liest Events aus einem MPSC-Kanal (`Receiver<SensorEvent>`) und schreibt sie auf standard-out.
   * Drei Worker-Threads (Sender-Kanäle):
     * **Thread 1 (Keyframes):** Führt die Erfassungsschleife für das Ziel-HWND aus.
     * **Thread 2 (UIA):** Pollt den UIA-Fokus.
     * **Thread 3 (Raw Input):** Startet die Win32-Message-Schleife für Maus und Tastatur.
   * **Koordination:** Wenn Thread 2 ein Passwortfeld oder eine sensitive Anwendung erkennt, setzt er ein atomares Flag (`PAUSE_INPUT`), welches Thread 3 anweist, eingehende Tastatur-/Maus-Events direkt zu verwerfen.

Soll ich mit der Implementierung dieses Unified Daemons beginnen? Oder gibt es andere Aspekte des Reviews, die wir zuerst vertiefen wollen?

Co-authored-by: Antigravity <antigravity@deepmind.com>
