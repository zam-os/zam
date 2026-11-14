# ZAM (Zusammen) 🤝

**Learn with calm active recall — free and offline on Desktop & Mobile, with optional AI and Agentic Coding.**

> *ZAM is Bavarian for "together".*

Start with the **ZAM Desktop Studio** (a native Tauri app for macOS, Windows, and Linux) or the **mobile apps** (Android and iOS): install the app, import free learning content, and review offline with FSRS-6 spaced repetition — no account, no terminal, and no AI model required.

🌐 **[zam-os.org](https://zam-os.org)** — the project website, in 7 languages · [Deutsch](README.de.md)

---

## 1. Install Desktop or Mobile

The fastest way to start is the app itself — no command line needed:

- **Desktop Studio (macOS · Windows · Linux)** — download the latest native installer from [GitHub Releases](https://github.com/zam-os/zam/releases).
- **Mobile Apps (Android · iOS / iPadOS)** — install the companion app from [GitHub Releases](https://github.com/zam-os/zam/releases) (standalone local library, optional sync later).

Prefer a terminal installer for macOS/Linux/Windows (installs Desktop Studio + `zam` CLI)?

```bash
# macOS · Linux
curl -fsSL https://zam-os.org/install.sh | sh
```

```powershell
# Windows · PowerShell
irm https://zam-os.org/install.ps1 | iex
```

Or build from source (`git clone` → `npm install && npm run build`, and `zam ui --build` if you want to build a native Desktop installer locally).

---

## 2. Import Free Content & Learn (Default Free Mode)

On first launch, **Free Mode** is active by default. The guided onboarding asks who is learning and takes you straight to free content — no API key, no terminal, and no AI clutter:

- **ZAM Academy** ([academy.zam-os.org](https://academy.zam-os.org)) — free interactive training apps paired with curated cards and prerequisite links.
- **Open Library & Curricula** — browse open-content collections and bundled curriculum topics straight inside the app.
- **Anki `.apkg`, CSV & TSV** — bring your existing decks and keep studying with **FSRS-6 spaced repetition** over a prerequisite graph.
- **Knowledge Atlas & Calm Review UI** — inspect what you know as islands connected by prerequisite threads. In Free Mode, review mode switchers, voice mode, Photo/PDF AI drafting, card splitting/foundations AI tools, and CLI/agent menus stay hidden.

Your progress stays on your machine in one local SQLite database (`~/.zam/zam.db`). Multi-device sync is an optional later upgrade in Settings.

---

## 3. Three Progressive Modes in Desktop Studio

Switch modes at the top of **Settings** whenever you want more capabilities:

### Mode 1 · Free *(Default — Desktop & Mobile)*

Zero configuration and zero AI cost. Everything works offline with your local library, imported decks, ZAM Academy cells, and clean flashcard / ready-made choice recall.

### Mode 2 · With AI *(Optional — Desktop & Mobile)*

Flip **Settings → With AI** and run the **AI Setup Wizard** to connect a **Cloud API** or a **local runtime** (**Ollama**, **FastFlowLM**). This unlocks:

- **Answer & Variation feedback modes** plus the in-session mode switcher (`Flash`, `Choice`, `AI`, `Auto`).
- **Hands-free Voice mode** for walking or commuting (on-device speech or optional cloud speech endpoints).
- **Material & Topic import** — turn photos, PDFs, notes, URLs, or a stated goal into draft cards for review, plus AI foundation linking and card splitting in the editor.

### Mode 3 · Agentic Coding *(Alpha — Desktop only)*

> **Model requirement (Alpha):** Agentic Coding decomposes real coding/engineering tasks into atomic concepts, detects prerequisite gaps, and observes your work unobtrusively. This requires a frontier-grade AI model such as **Claude Opus+**, **GPT 6.1 Sol+**, or **Gemini 4+…**. *Mobile does not include Agentic Coding.*

Setting up **Agentic Coding** is the longest path and lives behind **With AI**:

1. **Connect a frontier AI model** in **With AI** Settings (**Claude Opus+**, **GPT 6.1 Sol+**, **Gemini 4+…**).
2. **Turn on Agentic Coding (`Alpha`)** inside AI Settings (or run the **Agentic Coding Wizard**). ZAM automatically ensures the `zam` CLI is installed on your `PATH` and rolls out the `/zam` and `/okf` skills into your configured workspaces.
3. **Connect your AI agent app via MCP** — ZAM supports the agent apps below (one click in Studio or via CLI; your agent may prompt to approve the MCP server):

| Agent | CLI equivalent |
|---|---|
| **Claude** (Code / desktop app) | `zam agent connect claude-code` |
| **Codex** | `zam agent connect codex` |
| **ZCode** | `zam agent connect zcode` |
| **Antigravity** | `zam agent connect antigravity` |
| **OpenCode** | `zam agent connect opencode` |
| **GitHub Copilot** (CLI / app) | `zam agent connect copilot` |
| **Goose** | `zam agent connect goose` |
| **Grok Build** | `zam agent connect grok` |
| **Hermes** | `zam agent connect hermes` |

4. **Learn while you work** — a learner works on real tasks with an AI agent and keeps what they learn through ZAM's reviews. Open your agent, type **`/zam`**, and work normally: ZAM turns everyday work with an AI agent into active-recall practice, so automation sharpens skills instead of eroding them. ZAM watches the work and quietly marks a step learned when the learner does it well unaided.

*(For GitHub Copilot, `zam agent connect copilot` also installs user-scoped Studio, Recall, Graph, and Settings canvases. The repo and npm package also follow [Agent Plugins v1.0.0](https://agent-plugins.org/) — source checkouts need `npm ci && npm run build` first; see [ZAM Agent Plugin](docs/AGENT_PLUGIN.md).)*

---

## How ZAM works

- **Surfaces** — the Desktop Studio and the mobile apps handle setup, learning content and focused review. The Desktop Studio is a Tauri app for setup, learning content and focused review, backed by a local database (`~/.zam/zam.db`) shared with the optional CLI and AI agent.
- **Token** — one atomic concept worth remembering, tagged with a Bloom level (1 remember → 5 create).
- **Card** — your personal spaced-repetition state for a token (**FSRS-6** with short learning and relearning steps).
- **Prerequisites** — a graph of what must be understood first; ZAM protects foundations before quizzing advanced cards.
- **AI-agnostic kernel** — all learning logic lives in `src/kernel/` with zero LLM dependencies; optional AI and agent layers sit strictly on top. See [Kernel Architecture](docs/okf/kernel-architecture.md).

<details>
<summary>CLI reference for power users</summary>

```bash
zam ui                          # launch Desktop Studio
zam init                        # guided CLI setup (workspace, model, database, skills)
zam agent connect claude-code   # or codex · zcode · grok · antigravity · opencode · copilot · goose · hermes
zam mcp                         # start stdio MCP server
```

</details>

---

## Documentation

- 🌐 [zam-os.org](https://zam-os.org) — project website, in 7 languages
- 🎓 [ZAM Academy](https://academy.zam-os.org) — free interactive training apps
- [Usage & maintenance](docs/USAGE.md) · [Contributing](CONTRIBUTING.md) · [Architecture](docs/ARCHITECTURE.md)

## License

Apache 2.0 — see [LICENSE](LICENSE).
