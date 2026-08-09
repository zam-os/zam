# ZAM (Zusammen) 🤝

**Do real work with your AI — and keep the knowledge instead of losing it.**

> *ZAM is Bavarian for "together".*

ZAM turns everyday work with your AI agent into active-recall practice, so growing
automation doesn't mean growing dependence. You get the task done **and** you get
sharper — the two stop being a trade-off.

Don't just automate. **Elevate.**

🌐 **[zam-os.org](https://zam-os.org)** — the project website, in 7 languages.

---

## Who ZAM is for

Anyone who works with an AI agent and doesn't want to get rusty as it takes on more —
whether you're learning the field (say, a *Fachinformatiker* apprentice building durable
competence), sharpening your craft on the job, or simply keen to keep growing while you
automate. If you're pairing with Claude, Codex, Copilot & co. anyway, ZAM makes that time
compound into lasting skill.

---

## What ZAM does today

- **Rides along in your AI agent.** As you work a real task, ZAM breaks it into small
  knowledge concepts, notices which ones you're due to revisit, and weaves them into
  the session.
- **Watches you work.** Do a step well on your own and ZAM quietly marks it learned — no
  interruption. When no real task can show what you know, it asks a focused recall
  question. Both are active recall.
- **Remembers what you're forgetting.** Every concept is scheduled with FSRS-6 spaced
  repetition, including short learning and relearning steps, over a prerequisite graph.
- **Stays on your machine.** One local SQLite database (`~/.zam/zam.db`), shared by the
  agent and the Desktop Studio. Review works offline; local LLMs (Ollama, FastFlowLM)
  are supported.

---

## Two places to use ZAM

Your **agent app** is the main workbench. **ZAM Desktop Studio** is for setup, content,
and focused review. They share the same local database, so progress in one shows up in
the other.

### 1. In your AI agent — *the workbench*

This is where the real learning happens: turning actual tasks into practice, observing
your work, and guiding you step by step. ZAM connects to the agent apps you already use:

| Agent | Connect with |
|---|---|
| **Claude** (Code / desktop app) | `zam agent connect claude-code` |
| **Codex** | `zam agent connect codex` |
| **Antigravity** | `zam agent connect antigravity` |
| **OpenCode** | `zam agent connect opencode` |
| **GitHub Copilot** (CLI / app) | `zam agent connect copilot` |
| **Goose** | `zam agent connect goose` |
| **Hermes** | `zam agent connect hermes` |

One command writes the MCP config (your agent may ask you to approve the server). For
GitHub Copilot, it also installs user-scoped Studio, Recall, Graph, and Settings canvases;
restart Copilot or start a new session after connecting. Then just type **`/zam`** — or
say "let's do this together with ZAM" — and work normally.

#### Portable Agent Plugin

The repository and published npm package also follow the vendor-neutral
[Agent Plugins v1.0.0](https://agent-plugins.org/) format. Compatible clients can load
the package root to discover the ZAM skill and stdio MCP server together. A source
checkout needs `npm ci && npm run build` first; published packages already contain the
runtime. See [ZAM Agent Plugin](docs/AGENT_PLUGIN.md) for the layout and validation.

### 2. ZAM Desktop Studio — *setup, content & graph*

A native app (`zam ui`) for the things a chat window isn't good at:

- **Guided setup** — the first start connects your AI model, agent, and workspace one
  page at a time; everything stays editable in Settings later.
- **Easier configuration** — pick your language and local AI model in a settings panel,
  not a config file.
- **Import your own material** — paste notes, point ZAM at a source, or walk a structured
  curriculum; a guided wizard turns any of them into review cards.
- **Edit your content** — a real editor for concepts, questions, and prerequisites.
- **See your knowledge graph** — your concepts as a living map of what builds on what.
- **Review** — run focused active-recall rounds right in the app.

```bash
zam ui            # launch the Studio
zam ui --build    # one-time: build a native installer (needs Rust)
```

> **Review works in both places.** Observation and guided task-work happen inside your agent.

---

## Quickstart

**1. Get ZAM.** One line installs the desktop app and the `zam` CLI:

```bash
# macOS · Linux
curl -fsSL https://zam-os.org/install.sh | sh
```

```powershell
# Windows · PowerShell
irm https://zam-os.org/install.ps1 | iex
```

Or grab an installer from [Releases](https://github.com/zam-os/zam/releases), or build
from source (`git clone` → `npm install && npm run build`).

**2. Open ZAM.** The first start walks you through setup, one page at a time: who you're
learning as, your AI model (cloud or local), your agent, your workspace, and your first
learning content — from a curriculum, your own sources, a project, or a goal you name.
Every page can be skipped and finished later; the dashboard keeps the remaining steps as
a checklist. No terminal required.

**3. Learn while you work.** Open your agent, start a real task, and type **`/zam`**. It
checks what's due, plans the concepts behind the task, hands you the work, watches how it
goes, and updates your schedule. Prefer a gentler start? Import material and do a review
round right in the Studio.

Multi-device (a server database and mobile pairing) is an optional later upgrade in
Settings — the first run stays fully local.

### Prefer the terminal?

The same setup runs as commands — `zam init` is the guided wizard, CLI-style:

```bash
zam init                        # workspace · AI model · database · /zam skill
zam agent connect claude-code   # or codex · antigravity · opencode · copilot · goose · hermes
```

---

## How it works

- **Token** — one atomic concept worth remembering, tagged with a Bloom level (1 remember → 5 create).
- **Card** — your personal spaced-repetition state for a token (FSRS-6).
- **Prerequisites** — a graph of what must be understood first; ZAM won't quiz a concept
  whose foundations you've just forgotten.
- **Sessions** — every work/learning episode is logged, so ratings come from real evidence.

The learning engine is an **AI-agnostic kernel** with zero LLM dependencies; the agent
layer just drives it. See [Architecture](docs/ARCHITECTURE.md).

---

## Documentation

- 🌐 [zam-os.org](https://zam-os.org) — project website, in 7 languages
- [Usage & maintenance](docs/USAGE.md) · [Contributing](CONTRIBUTING.md) · [Architecture](docs/ARCHITECTURE.md)

## License

Apache 2.0 — see [LICENSE](LICENSE).
