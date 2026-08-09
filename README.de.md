# ZAM (Zusammen) 🤝

**Arbeite mit deiner KI an echten Aufgaben — und behalte das Wissen, statt es zu verlieren.**

> *ZAM ist Bairisch für „zusammen".*

ZAM macht aus der täglichen Arbeit mit deinem KI-Agenten aktives Erinnern (Active
Recall) — damit wachsende Automatisierung nicht wachsende Abhängigkeit bedeutet. Die
Aufgabe wird erledigt **und** du wirst besser — das eine geht nicht mehr auf Kosten des
anderen.

Nicht nur automatisieren. **Wachsen.**

🌐 **[zam-os.org](https://zam-os.org)** — die Projekt-Website, in 7 Sprachen.

---

## Für wen ZAM ist

Für alle, die mit einem KI-Agenten arbeiten und dabei nicht einrosten wollen, während er
immer mehr übernimmt — ob du das Fach gerade lernst (etwa als *Fachinformatiker*-Azubi,
der dauerhafte Kompetenz aufbaut), dein Handwerk im Job schärfst oder einfach weiter
wachsen willst, während du automatisierst. Wenn du ohnehin mit Claude, Codex, Copilot
& Co. arbeitest, macht ZAM aus dieser Zeit bleibendes Können.

---

## Was ZAM heute kann

- **Läuft in deinem KI-Agenten mit.** Während du an einer echten Aufgabe arbeitest,
  zerlegt ZAM sie in kleine Wissenskonzepte, erkennt, welche zur Wiederholung anstehen,
  und webt sie in die Sitzung ein.
- **Sieht dir bei der Arbeit zu.** Machst du einen Schritt selbst gut, wird er still als
  gelernt markiert — ohne Unterbrechung. Wenn keine echte Aufgabe zeigen kann, was du
  weißt, stellt ZAM eine gezielte Erinnerungsfrage. Beides ist aktives Erinnern.
- **Merkt sich, was du vergisst.** Jedes Konzept wird mit FSRS-6-Spaced-Repetition samt
  kurzen Lern- und Wiederlernschritten über einen Voraussetzungsgraphen geplant.
- **Bleibt auf deinem Rechner.** Eine lokale SQLite-Datenbank (`~/.zam/zam.db`), geteilt
  von Agent und Desktop Studio. Wiederholen geht offline; lokale LLMs (Ollama,
  FastFlowLM) werden unterstützt.

---

## Zwei Orte, ein System

Deine **Agenten-App** ist die eigentliche Werkbank. Das **ZAM Desktop Studio** ist für
Einrichtung, Inhalte und fokussiertes Wiederholen. Beide teilen dieselbe lokale
Datenbank — Fortschritt an einem Ort erscheint am anderen.

### 1. In deinem KI-Agenten — *die Werkbank*

Hier passiert das echte Lernen: Aufgaben werden zur Übung, ZAM beobachtet deine Arbeit
und führt dich Schritt für Schritt. ZAM verbindet sich mit den Agenten-Apps, die du
ohnehin nutzt:

| Agent | Verbinden mit |
|---|---|
| **Claude** (Code / Desktop-App) | `zam agent connect claude-code` |
| **Codex** | `zam agent connect codex` |
| **Antigravity** | `zam agent connect antigravity` |
| **OpenCode** | `zam agent connect opencode` |
| **GitHub Copilot** (CLI / App) | `zam agent connect copilot` |
| **Goose** | `zam agent connect goose` |
| **Hermes** | `zam agent connect hermes` |

Ein Befehl schreibt die MCP-Konfiguration (dein Agent fragt ggf. nach Freigabe). Für
GitHub Copilot installiert er zusätzlich die Studio-, Recall-, Graph- und
Settings-Canvases; starte Copilot danach neu. Dann einfach **`/zam`** tippen — oder
„lass uns das zusammen mit ZAM machen" sagen — und normal arbeiten.

#### Portables Agent Plugin

Das Repository und das veröffentlichte npm-Paket folgen zusätzlich dem
herstellerneutralen Format
[Agent Plugins v1.0.0](https://agent-plugins.org/). Kompatible Clients können das
Paketverzeichnis laden und finden darin ZAM-Skill und stdio-MCP-Server gemeinsam. Ein
Quellcode-Checkout braucht vorher `npm ci && npm run build`; veröffentlichte Pakete
enthalten die Laufzeit bereits. Aufbau und Prüfung stehen unter
[ZAM Agent Plugin](docs/AGENT_PLUGIN.md).

### 2. ZAM Desktop Studio — *Einrichtung, Inhalte & Graph*

Eine native App (`zam ui`) für das, worin ein Chatfenster schlecht ist:

- **Geführte Einrichtung** — der erste Start verbindet KI-Modell, Agent und
  Arbeitsbereich Seite für Seite; alles bleibt später in den Einstellungen änderbar.
- **Einfachere Konfiguration** — Sprache und lokales KI-Modell in einem
  Einstellungsfenster, nicht in einer Konfigdatei.
- **Eigenes Material importieren** — Notizen einfügen, auf eine Quelle zeigen oder einen
  strukturierten Lehrplan durchgehen; ein geführter Assistent macht daraus
  Wiederholungskarten.
- **Inhalte bearbeiten** — ein echter Editor für Konzepte, Fragen und Voraussetzungen.
- **Deinen Wissensgraphen sehen** — Konzepte als lebendige Karte dessen, was worauf
  aufbaut.
- **Wiederholen** — fokussierte Active-Recall-Runden direkt in der App.

```bash
zam ui            # das Studio starten
zam ui --build    # einmalig: nativen Installer bauen (braucht Rust)
```

> **Wiederholen geht an beiden Orten.** Beobachtung und begleitete Aufgaben passieren in
> deinem Agenten.

---

## Schnellstart

**1. ZAM holen.** Eine Zeile installiert die Desktop-App und die `zam`-CLI:

```bash
# macOS · Linux
curl -fsSL https://zam-os.org/install.sh | sh
```

```powershell
# Windows · PowerShell
irm https://zam-os.org/install.ps1 | iex
```

Oder nimm einen Installer von den [Releases](https://github.com/zam-os/zam/releases),
oder baue aus dem Quellcode (`git clone` → `npm install && npm run build`).

**2. ZAM öffnen.** Der erste Start führt dich Seite für Seite durch die Einrichtung: als
wer du lernst, dein KI-Modell (Cloud oder lokal), dein Agent, dein Arbeitsbereich und
dein erster Lernstoff — aus einem Lehrplan, eigenen Quellen, einem Projekt oder einem
Ziel, das du benennst. Jede Seite lässt sich überspringen und später abschließen; das
Dashboard führt die verbleibenden Schritte als Liste. Kein Terminal nötig.

**3. Lerne, während du arbeitest.** Öffne deinen Agenten, starte eine echte Aufgabe und
tippe **`/zam`**. ZAM prüft, was ansteht, plant die Konzepte hinter der Aufgabe, übergibt
dir die Arbeit, schaut zu, wie es läuft, und aktualisiert deinen Plan. Lieber sanft
anfangen? Importiere Material und mach eine Wiederholungsrunde direkt im Studio.

Mehrgeräte-Betrieb (Server-Datenbank und Mobile-Kopplung) ist ein optionales späteres
Upgrade in den Einstellungen — der erste Start bleibt vollständig lokal.

### Lieber im Terminal?

Dieselbe Einrichtung gibt es als Befehle — `zam init` ist der geführte Assistent im
CLI-Gewand:

```bash
zam init                        # Arbeitsbereich · KI-Modell · Datenbank · /zam-Skill
zam agent connect claude-code   # oder codex · antigravity · opencode · copilot · goose · hermes
```

---

## Wie es funktioniert

- **Token** — ein atomares Konzept, das es sich zu merken lohnt, mit Bloom-Stufe
  (1 erinnern → 5 erschaffen).
- **Card** — dein persönlicher Spaced-Repetition-Zustand für ein Token (FSRS-6).
- **Voraussetzungen** — ein Graph dessen, was zuerst verstanden sein muss; ZAM fragt kein
  Konzept ab, dessen Grundlagen dir gerade entglitten sind.
- **Sessions** — jede Arbeits- und Lernepisode wird protokolliert, damit Bewertungen aus
  echten Belegen stammen.

Die Lern-Engine ist ein **KI-agnostischer Kernel** ohne jede LLM-Abhängigkeit; die
Agenten-Schicht steuert ihn nur. Siehe [Architektur](docs/ARCHITECTURE.md).

---

## Dokumentation

- 🌐 [zam-os.org](https://zam-os.org) — Projekt-Website, in 7 Sprachen
- [English Version](README.md) · [Nutzung & Wartung](docs/USAGE.md) · [Mitmachen](CONTRIBUTING.md) · [Architektur](docs/ARCHITECTURE.md)

## Lizenz

Apache 2.0 — siehe [LICENSE](LICENSE).
