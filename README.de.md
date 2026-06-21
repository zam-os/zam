# ZAM (Zusammen) 🤝

**Der Symbiotic Learning Kernel: Menschliche Intelligenz durch KI-Kollaboration stärken.**

> *ZAM ist Bayerisch für „zusammen".*

ZAM ist ein Open-Source-Framework, das eine tiefe Symbiose zwischen Mensch und KI schafft. Während herkömmliche KI den Menschen oft passiv macht, nutzt ZAM den technologischen Fortschritt, um menschliches Wissen zu vertiefen, kognitiven Verfall durch Automatisierung zu verhindern und Gemeinschaften organisch zu vernetzen.

---

## 🚀 Phase 1: Die Individuelle Symbiose *(Der Fokus)*

In Phase 1 konzentriert sich ZAM auf die Interaktion zwischen einem Menschen und seinem persönlichen Agenten. Das Ziel: Aufgaben effizient lösen und dabei wertvolles Wissen erwerben und behalten.

> **„Don't just automate — Elevate."**

Wenn die KI Aufgaben übernimmt, sorgt der ZAM Learning-Kernel dafür, dass der Mensch die Kontrolle und das Verständnis behält:

- **Wissenserhalt** — Durch Active Recall und Spaced Repetition erinnert dich ZAM an wichtiges Fachwissen, das du für deine Arbeit brauchst, damit du trotz zunehmender Automatisierung nicht „verlernst".
- **Kompetenz-Transfer** — Während ZAM die Routine übernimmt (E-Mails, Telefonlisten, Zeitplanung), bringt dir der Agent gleichzeitig Konzepte des modernen Projektmanagements oder der Helferakquise bei.
- **Zeit-Reinvestition** — Die gewonnene Zeit wird nicht in Passivität investiert, sondern in das Erlernen neuer, herausfordernder Aufgaben.

### Beispiel: Organisation eines Pfarrfests

| Schritt | Was ZAM übernimmt | Was du tust |
|---|---|---|
| **Planung** | Strukturiert Agenda und Zeitplan | Vision und Prioritäten festlegen |
| **Lernen** | Erklärt effektive Öffentlichkeitsarbeit und Freiwilligenmotivation | Mit den Konzepten arbeiten |
| **Automatisierung** | Entwirft Einladungen, verwaltet Dokumente | Auf den menschlichen Kontakt konzentrieren |

---

## 🌐 Ausblick: Phase 2 – Die Vernetzte Gemeinschaft

Sobald der individuelle Agent deinen Wissensstand, deine Interessen und deine Wachstumsziele kennt, beginnt die gesellschaftliche Ebene.

### Agent-to-Agent Marketplace

Agenten kommunizieren untereinander, um Bedarfe und Angebote der Gemeinschaft abzugleichen:

1. **Bedarfs-Kommunikation** — Dein Agent signalisiert: *„Wir suchen einen Koch und Musiker für das Pfarrfest."*
2. **Gezieltes Matching** — Andere Agenten scannen die Profile ihrer Menschen — nicht nur nach Verfügbarkeit, sondern nach Wachstumspotenzial:
   > *„Mein Mensch möchte seine Kochkünste in großem Rahmen erproben (Lernziel) – das Pfarrfest ist die perfekte Gelegenheit zur aktiven Wissensanwendung."*
3. **Akkreditierte Communities** — Das Matching erfolgt bevorzugt innerhalb vertrauenswürdiger Kreise (z. B. der eigenen Pfarrei), um echte menschliche Begegnungen zu fördern.

---

## 🛠 Technischer Aufbau: Der Learning-Kernel

ZAM ist als **KI-agnostischer Kernel** konzipiert — ein CLI-Tool, das sich nahtlos in bestehende Workflows integriert:

- **CLI-Integration** — Kompatibel mit `Claude Code`, `Codex`, `Copilot CLI` und `Gemini CLI`.
- **Modularität** — Das System kann für länderspezifische oder kulturelle Eigenheiten „geforkt" werden (*Social Forking*).

### Zwei Repositories, ein System

ZAM ist in zwei Bereiche aufgeteilt:

- **Core** ([`zam-os/zam`](https://github.com/zam-os/zam)) — Der KI-agnostische Learning-Kernel, CLI, Bridge-Protokoll und System-Beliefs. Von allen geteilt.
- **Personal** (Fork von [`zam-os/zam-personal`](templates/personal/)) — Deine Beliefs, deine Ziele, deine Identität. Du forkst es, du besitzt es.

Einstieg: `zam whoami --set <deine-id>`

---

## 🔄 ZAM aktuell halten

Prüfe, ob eine neuere Version vorliegt, und aktualisiere — ZAM wählt den passenden Mechanismus je nachdem, wie diese Kopie installiert wurde:

```bash
zam update          # neueste Version anwenden (fragt nach; -y überspringt)
zam update check    # nur prüfen, ob ein Update verfügbar ist
```

Was `zam update` je nach Installationskanal tut:

- **Developer** (Quell-Checkout, Standard für Mitwirkende) — holt den neuesten Quellcode, installiert Abhängigkeiten neu, baut die CLI und frischt die Skill-Dateien auf (`zam setup --force`). Danach den Agent-Client (z. B. Claude Code) neu starten, damit der aktualisierte `/zam`-Skill geladen wird.
- **winget / Homebrew** — delegiert an `winget upgrade` / `brew upgrade`, damit eine paketverwaltete Installation nie selbst ersetzt wird.
- **Direkt-Download / Desktop** — installiert ein signiertes In-place-Update über ZAM Desktop.

`zam update` verweigert einen Developer-Checkout mit uncommitteten Änderungen; committe oder stashe sie zuerst, oder nutze `--force`. Design-Details: [ADR-0012](docs/adr/0012-approachable-setup-and-self-update.md).

---

## 🏛 Vision: Eine paradiesische Zukunft

ZAM ist das Werkzeug für den Übergang in eine Welt, in der Fürsorge und gemeinsames Wachstum die Währung sind.

- **Ressourcen-Steuerung** — Agenten verwalten Gemeinschaftsfinanzen (z. B. das 10%-Solidaritätsmodell) und optimieren Einkäufe.
- **Menschliche Nähe** — Die Technik tritt in den Hintergrund, um echten Austausch von Mensch zu Mensch zu ermöglichen.
- **Globale Skalierung** — Unterstützt durch Institutionen wie die Weltkirche, wird ZAM zum Standard für eine gerechte, gebildete und fürsorgliche Weltgemeinschaft.

---

## 🖥 ZAM Desktop Studio

ZAM enthält nun eine plattformübergreifende Desktop-Anwendung im Verzeichnis [`desktop/`](desktop/). Entwickelt mit **Tauri v2**, **Vite**, **TypeScript** und **Vanilla CSS**, bietet sie ein hochmodernes Dark-Mode-Lernstudio, das dieselbe SQLite-Datenbank wie das CLI nutzt.

### Starten unter Windows, macOS oder Linux:

1. **CLI Bridge kompilieren**:
   Stelle sicher, dass der neueste CLI-Code im Hauptverzeichnis kompiliert ist:
   ```bash
   npm install
   npm run build
   ```

2. **Desktop-Anwendung starten**:
   Wechsle in das Verzeichnis `desktop/`, installiere die Abhängigkeiten und starte Tauri:
   ```bash
   cd desktop
   npm install
   npm run tauri dev
   ```

Dies kompiliert das Rust-Backend im Hintergrund, startet den Vite-Entwicklungsserver und öffnet das native Anwendungsfenster. Detaillierte Informationen und Konfigurationsschritte für lokale KI (Ollama/FastFlowLM) findest du im [Desktop-Handbuch](desktop/README.md).

### 📦 Automatische GitHub Releases & Native Installer

Wir haben eine **GitHub Actions CI/CD-Pipeline** integriert, die derzeit native Installationsdateien für Windows (`.msi`/`.exe`) und Linux (`.deb`/`.rpm`) kompiliert und verpackt, sobald ein neuer Git-Tag gepusht wird. AppImage-Pakete sind vorläufig ausgesetzt, weil `linuxdeploy` das mitgelieferte native `libsql`-Modul noch nicht zuverlässig verarbeiten kann. macOS kann weiterhin aus dem Quellcode gebaut werden; signierte und notarisierte macOS-Release-Artefakte folgen, sobald der Apple-Signing-Account verfügbar ist.

Um eine neue Version zu veröffentlichen (z.B. `v0.1.0`):

```bash
# Aktuellen Commit taggen
git tag v0.1.0

# Den Tag zu GitHub pushen
git push origin v0.1.0
```

Dies startet automatisch die Windows- und Linux-Builds auf GitHub-Runnern und erstellt einen Entwurf (Draft) mit den kompilierten Installationsdateien.

---

## 📖 Dokumentation

- [English Version](README.md)
- [Beitragsleitfaden](CONTRIBUTING.md)
- [Architektur](docs/ARCHITECTURE.md)

---

## 📄 Lizenz

Apache-2.0-Lizenz — siehe [LICENSE](LICENSE) für Details.
