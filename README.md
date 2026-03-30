# ZAM (Zusammen) 🤝

**The Symbiotic Learning Kernel: Elevating Human Intelligence through AI Collaboration.**

> *ZAM is Bavarian for "together".*

ZAM is an open-source framework that creates a deep symbiosis between humans and AI. While conventional AI often renders people passive, ZAM harnesses technological progress to deepen human knowledge, prevent cognitive decline caused by automation, and organically connect communities.

---

## 🚀 Phase 1: Individual Symbiosis *(Current Focus)*

Phase 1 centers on the interaction between a person and their personal agent. The goal: solve tasks efficiently while actively acquiring and retaining valuable knowledge.

> **"Don't just automate — Elevate."**

When the AI takes on tasks, the ZAM Learning Kernel ensures the human stays in control and in the loop:

- **Knowledge Retention** — Through Active Recall and Spaced Repetition, ZAM reminds you of the domain knowledge you need for your work, so that growing automation doesn't mean growing dependence.
- **Competence Transfer** — While ZAM handles the routine (emails, contact lists, scheduling), your agent simultaneously teaches you concepts from modern project management, volunteer coordination, or whatever domain you're working in.
- **Time Reinvestment** — The time you gain is not consumed by passivity, but reinvested in learning new, more challenging skills.

### Example: Organizing a Parish Festival

| Step | What ZAM does | What you do |
|---|---|---|
| **Planning** | Structures the agenda and timeline | Define the vision and priorities |
| **Learning** | Teaches you effective PR and volunteer motivation | Engage with the concepts |
| **Automation** | Drafts invitations, manages documents | Focus on human connection |

---

## 🌐 Phase 2: The Connected Community *(Outlook)*

Once your personal agent knows your knowledge level, interests, and growth goals, ZAM expands to the community layer.

### Agent-to-Agent Marketplace

Agents communicate with each other to match community needs and offerings:

1. **Need Broadcasting** — Your agent signals: *"We're looking for a cook and a musician for the parish festival."*
2. **Growth-Aware Matching** — Other agents scan their people's profiles — not just for availability, but for learning potential:
   > *"My person wants to practice cooking at scale (learning goal) — the festival is the perfect opportunity for active knowledge application."*
3. **Accredited Communities** — Matching is prioritized within trusted circles (e.g. your own parish) to foster genuine human encounters.

---

## 🛠 Technical Architecture: The Learning Kernel

ZAM is designed as an **AI-agnostic kernel** — a CLI tool that integrates seamlessly into existing workflows:

- **CLI Integration** — Compatible with `Claude Code`, `Copilot CLI`, and `Gemini CLI`.
- **Modularity** — The system can be forked for region- or culture-specific adaptations (*Social Forking*).

### Two Repositories, One System

ZAM is split into two concerns:

- **Core** ([`zam-os/zam`](https://github.com/zam-os/zam)) — The AI-agnostic learning kernel, CLI, bridge protocol, and system beliefs. Shared by everyone.
- **Personal** (fork of [`zam-os/zam-personal`](templates/personal/)) — Your beliefs, your goals, your identity. You fork it, you own it.

Get started: `zam whoami --set <your-id>`

---

## 🧹 Review maintenance

Review sessions are not limited to `1`-`4` recall ratings anymore. When a card is wrong, obsolete, or unwanted, the review flow can now:

- edit token fields inline
- deprecate the token
- hard-delete the token after an impact preview + confirmation
- delete only your personal card while keeping the token

The same maintenance actions are also available from the CLI:

- `zam token edit --slug <slug> ...`
- `zam token delete --slug <slug>` for preview, then `--force` to delete
- `zam card delete --user <id> --token <slug>`
- `zam bridge review-action ...` for AI clients

Token deletion is global. Card deletion is per-user.

---

## 🏛 Vision: A Flourishing Future

ZAM is a tool for the transition to a world where care and shared growth are the common currency.

- **Resource Stewardship** — Agents help manage community finances (e.g. a 10% solidarity model) and optimize collective purchasing.
- **Human Proximity** — Technology steps back to enable genuine person-to-person exchange.
- **Global Scalability** — Supported by institutions like the global church, ZAM aims to become a standard for a just, educated, and caring world community.

---

## 📖 Documentation

- [Deutsche Version](README.de.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Architecture](docs/ARCHITECTURE.md)

---

## 📄 License

Apache 2.0 License — see [LICENSE](LICENSE) for details.
