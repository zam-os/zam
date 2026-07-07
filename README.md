# ZAM (Zusammen) 🤝

**Do real work with your AI — and keep the knowledge instead of losing it.**

> *ZAM is Bavarian for "together".*

ZAM turns everyday work with your AI agent into active-recall practice, so growing
automation doesn't mean growing dependence. You get the task done **and** you get
sharper — the two stop being a trade-off.

Don't just automate. **Elevate.**

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
- **Watches instead of quizzing.** Do a step well on your own and ZAM quietly marks it
  learned — no interruption. It only asks when it can't tell from your work. The best
  session is one you barely notice.
- **Remembers what you're forgetting.** Every concept is scheduled with FSRS-5 spaced
  repetition over a prerequisite graph, so ZAM resurfaces things right before they'd slip.
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
| **GitHub Copilot** | `zam agent connect copilot` |
| **Goose** | `zam agent connect goose` |

One command writes the MCP config (your agent may ask you to approve the server). Then
just type **`/zam`** — or say "let's do this together with ZAM" — and work normally.

### 2. ZAM Desktop Studio — *setup, content & graph*

A native app (`zam ui`) for the things a chat window isn't good at:

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

**1. Get ZAM.** Grab an installer from [Releases](https://github.com/zam-os/zam/releases),
or build from source:

```bash
git clone https://github.com/zam-os/zam.git && cd zam
npm install && npm run build
```

**2. Set up — one guided wizard:**

```bash
zam init
```

`zam init` picks a workspace, detects your hardware, offers to install a local AI runner
(Ollama or FastFlowLM), initializes your database, and wires the `/zam` skill.

**3. Connect your agent:**

```bash
zam agent connect claude-code   # or codex · antigravity · opencode · copilot · goose
```

**4. Learn while you work.** Open your agent, start a real task, and type **`/zam`**. It
checks what's due, plans the concepts behind the task, hands you the work, watches how it
goes, and updates your schedule.

Prefer a gentler start? Run `zam ui`, import your training material, and do a review round
in the Studio.

---

## How it works

- **Token** — one atomic concept worth remembering, tagged with a Bloom level (1 remember → 5 create).
- **Card** — your personal spaced-repetition state for a token (FSRS-5).
- **Prerequisites** — a graph of what must be understood first; ZAM won't quiz a concept
  whose foundations you've just forgotten.
- **Sessions** — every work/learning episode is logged, so ratings come from real evidence.

The learning engine is an **AI-agnostic kernel** with zero LLM dependencies; the agent
layer just drives it. See [Architecture](docs/ARCHITECTURE.md).

---

## Documentation

- [Usage & maintenance](docs/USAGE.md) · [Contributing](CONTRIBUTING.md) · [Architecture](docs/ARCHITECTURE.md)

## License

Apache 2.0 — see [LICENSE](LICENSE).
