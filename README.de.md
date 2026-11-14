# ZAM (Zusammen) 🤝

**Nachhaltig lernen mit Active Recall — kostenlos und offline am Desktop & Mobilgerät, optional mit KI und Agentic Coding.**

> *ZAM ist Bairisch für „zusammen“.*

Starte direkt mit dem **ZAM Desktop Studio** (native Tauri-App für macOS, Windows und Linux) oder den **Mobile-Apps** (Android und iOS): App installieren, kostenlose Lerninhalte importieren und offline mit FSRS-6-Abstandswiederholung lernen — ohne Konto, ohne Terminal und ohne KI-Modell.

🌐 **[zam-os.org](https://zam-os.org)** — die Projekt-Website, in 7 Sprachen · [English Version](README.md)

---

## 1. Desktop- oder Mobile-App installieren

Der schnellste Einstieg läuft direkt über die App — ganz ohne Terminal:

- **Desktop Studio (macOS · Windows · Linux)** — lade dir den aktuellen Installer von [GitHub Releases](https://github.com/zam-os/zam/releases).
- **Mobile-Apps (Android · iOS / iPadOS)** — installiere die Begleit-App über [GitHub Releases](https://github.com/zam-os/zam/releases) (funktioniert eigenständig lokal, optional später synchronisierbar).

Lieber ein Terminal-Einzeiler für Desktop Studio + `zam`-CLI?

```bash
# macOS · Linux
curl -fsSL https://zam-os.org/install.sh | sh
```

```powershell
# Windows · PowerShell
irm https://zam-os.org/install.ps1 | iex
```

Oder direkt aus dem Quellcode bauen (`git clone` → `npm install && npm run build`, und `zam ui --build`, um lokal einen nativen Desktop-Installer zu erzeugen).

---

## 2. Kostenlos Inhalte importieren & lernen (Standard-Modus)

Beim ersten Start ist standardmäßig der **Kostenlose Modus** aktiv. Das geführte Onboarding fragt, wer lernt, und bringt dich direkt zu kostenlosen Inhalten — ohne API-Key, ohne Terminal und ohne überladene KI-Menüs:

- **ZAM Academy** ([academy.zam-os.org](https://academy.zam-os.org)) — kostenlose interaktive Trainings-Apps mit passenden Lernkarten und Grundlagenverknüpfungen.
- **Open Library & Lehrpläne** — offene Sammlungen und gebündelte Lehrplanthemen direkt in der App durchsuchen und übernehmen.
- **Anki `.apkg`, CSV & TSV** — bestehende Stapel importieren und mit **FSRS-6-Spaced-Repetition** über einen Abhängigkeitsgraphen weiterlernen.
- **Wissensatlas & aufgeräumte Oberfläche** — sieh dein Wissen als Inseln mit roten Grundlagen-Fäden. Im kostenlosen Modus bleiben Modus-Umschalter, Sprachmodus, Foto-/PDF-Entwürfe, KI-Editor-Helfer sowie CLI- und Agenten-Menüs verborgen.

Dein Fortschritt bleibt lokal auf deinem Gerät in einer SQLite-Datenbank (`~/.zam/zam.db`). Mehrgeräte-Sync kannst du später optional in den Einstellungen einschalten.

---

## 3. Drei aufeinander aufbauende Modi im Desktop Studio

Oben in den **Einstellungen** schaltest du bei Bedarf schrittweise mehr Funktionen frei:

### Modus 1 · Kostenlos *(Standard — Desktop & Mobile)*

Keine Konfiguration und keine KI-Kosten. Alles läuft offline mit deiner lokalen Bibliothek, importierten Stapeln, ZAM-Academy-Modulen und sauberer Karten- bzw. vorgefertigter Auswahl-Abfrage.

### Modus 2 · Mit KI *(Optional — Desktop & Mobile)*

Schalte **Einstellungen → Mit KI** um und starte den **KI-Einrichtungs-Wizard**, um eine **Cloud-API** oder eine **lokale Runtime** (**Ollama**, **FastFlowLM**) zu verbinden. Das schaltet frei:

- **Antwort- & Variations-Feedback** sowie den Modus-Umschalter während der Abfrage (`Karten`, `Auswahl`, `KI`, `Auto`).
- **Freihand-Sprachmodus** für unterwegs (lokale Gerätesprache oder optionale Cloud-Sprachmodelle).
- **Material- & Themen-Import** — aus Fotos, PDFs, Notizen, Links oder Lernzielen per KI Kartenentwürfe erstellen sowie im Editor Grundlagen verknüpfen und Karten aufteilen.

### Modus 3 · Agentic Coding *(Alpha — nur Desktop)*

> **Modellanforderung (Alpha):** Agentic Coding zerlegt reale Entwicklungsaufgaben in Wissensbausteine, erkennt fehlende Grundlagen und beobachtet deine Arbeit leise im Hintergrund. Dafür brauchst du eine sehr leistungsfähige KI wie **Claude Opus+**, **GPT 6.1 Sol+** oder **Gemini 4+…**. *Auf Mobile ist Agentic Coding nicht vorgesehen.*

Der Weg zu **Agentic Coding** ist der längste und liegt bewusst hinter dem **Mit KI**-Schalter:

1. **Sehr leistungsfähige KI verbinden** in den KI-Einstellungen (**Claude Opus+**, **GPT 6.1 Sol+**, **Gemini 4+…**).
2. **Agentic Coding (`Alpha`) einschalten** (oder den **Agentic-Coding-Wizard** starten). ZAM richtet dabei automatisch die `zam`-CLI auf deinem `PATH` ein und rollt die `/zam`- und `/okf`-Skills in deine konfigurierten Arbeitsverzeichnisse aus.
3. **Coding-Agent per MCP verbinden** — ZAM unterstützt die folgenden Agenten-Apps (per Klick im Studio oder via CLI; dein Agent fragt ggf. nach Bestätigung für den MCP-Server):

| Agent | CLI-Befehl |
|---|---|
| **Claude** (Code / Desktop-App) | `zam agent connect claude-code` |
| **Codex** | `zam agent connect codex` |
| **ZCode** | `zam agent connect zcode` |
| **Antigravity** | `zam agent connect antigravity` |
| **OpenCode** | `zam agent connect opencode` |
| **GitHub Copilot** (CLI / App) | `zam agent connect copilot` |
| **Goose** | `zam agent connect goose` |
| **Grok Build** | `zam agent connect grok` |
| **Hermes** | `zam agent connect hermes` |

4. **Während der Arbeit lernen** — öffne deinen Agenten, tippe **`/zam`** ein und arbeite ganz normal an deiner Aufgabe. ZAM macht aus der täglichen Arbeit mit dem KI-Agenten aktives Erinnern, beobachtet deine Schritte und hakt Konzepte still als gekonnt ab, sobald du sie sicher selbst anwendest.

*(Für GitHub Copilot richtet `zam agent connect copilot` zusätzlich benutzerweite Studio-, Recall-, Graph- und Settings-Canvases ein. Das Repo und npm-Paket folgen außerdem dem Standard [Agent Plugins v1.0.0](https://agent-plugins.org/) — ein Quellcode-Checkout braucht vorher `npm ci && npm run build`; siehe [ZAM Agent Plugin](docs/AGENT_PLUGIN.md).)*

---

## Wie ZAM funktioniert

- **Oberflächen** — das **Desktop Studio** (native Tauri-App) und die **Mobile-Apps** übernehmen Einrichtung, Lerninhalte und fokussierte Abfrage über deine lokale SQLite-Datenbank (`~/.zam/zam.db`).
- **Token** — ein atomares Konzept mit Bloom-Stufe (1 Erinnern → 5 Erschaffen).
- **Karte** — dein persönlicher Lernzustand für ein Token (**FSRS-6** inklusive kurzer Lern- und Wiederlern-Schritte).
- **Grundlagen-Graph** — bildet ab, worauf Konzepte aufbauen; ZAM schützt fehlende Grundlagen zuerst.
- **KI-agnostischer Kernel** — die komplette Lernlogik liegt in `src/kernel/` ohne LLM-Abhängigkeiten; KI- und Agenten-Schichten sitzen strikt darüber. Siehe [Kernel-Architektur](docs/okf/kernel-architecture.md).

<details>
<summary>CLI-Referenz für Power-User</summary>

```bash
zam ui                          # Desktop Studio starten
zam init                        # geführte CLI-Einrichtung (Arbeitsverzeichnis, Modell, Datenbank, Skills)
zam agent connect claude-code   # oder codex · zcode · grok · antigravity · opencode · copilot · goose · hermes
zam mcp                         # stdio MCP-Server starten
```

</details>

---

## Dokumentation

- 🌐 [zam-os.org](https://zam-os.org) — Projekt-Website, in 7 Sprachen
- 🎓 [ZAM Academy](https://academy.zam-os.org) — kostenlose interaktive Trainings-Apps
- [Nutzung & Wartung](docs/USAGE.md) · [Mitmachen](CONTRIBUTING.md) · [Architektur](docs/ARCHITECTURE.md)

## Lizenz

Apache 2.0 — siehe [LICENSE](LICENSE).
