# Contributing to ZAM 🤝

First off — thank you for considering a contribution to ZAM. This project is built on the belief that technology should serve people, not the other way around. Every contribution, however small, helps move that vision forward.

---

## Ways to Contribute

You don't need to write code to contribute meaningfully:

- **Report a bug** — Open an issue describing what happened and what you expected.
- **Suggest a feature** — Share an idea that aligns with ZAM's mission.
- **Improve documentation** — Fix a typo, clarify an explanation, or translate content.
- **Write code** — Implement a feature, fix a bug, or improve test coverage.
- **Share your use case** — Tell us how you're using ZAM in your community.

---

## Ground Rules

ZAM is rooted in the principles of human dignity, solidarity, and subsidiarity. We ask all contributors to:

- Be respectful and constructive in all discussions.
- Keep the human at the center — contributions should elevate people, not replace them.
- Prefer simplicity over cleverness.
- Document your reasoning, not just your code.

---

## Getting Started

1. **Fork** the repository and clone it locally, then run `npm ci`.
2. Create a **feature branch**: `git checkout -b feature/your-idea`
3. Make your changes and commit with a clear message.
4. Run the verification chain below — CI runs the same steps.
5. Push to your fork and open a **Pull Request**.

### Before You Commit

```bash
npm run format     # Biome, fixes formatting in place
npm run lint       # must be clean
npm run typecheck  # must be clean
npm run test       # full Vitest suite, all pre-existing tests stay green
npm run build      # tsup must succeed
```

Run a single test file while iterating with `npm run test -- tests/kernel/<file>.test.ts`.

If you work with an AI coding agent, point it at [AGENTS.md](AGENTS.md) — it carries the same chain plus the repository's architectural rules.

### Commit Message Style

Use the following format:

```
<type>: <short summary>

<optional body explaining the why>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

Example:
```
feat: add spaced repetition scheduler to learning kernel

Implements a basic SM-2 algorithm for scheduling knowledge reviews,
ensuring users retain domain knowledge even as automation increases.
```

---

## Issues & Discussions

- Use **Issues** for bugs and concrete feature requests.
- Use **Discussions** for ideas, questions, and broader conversations about ZAM's direction.

Please search existing issues before opening a new one.

---

## Code Style

- Keep functions small and focused.
- Prefer explicit over implicit.
- Write tests for non-trivial logic.
- Add comments where the *why* is not obvious from the code.

---

## Community

ZAM is designed for communities — and we try to be one too. We welcome contributors from all backgrounds, especially those working in parishes, schools, community organizations, or social services. You don't have to be a software engineer to have valuable insight here.

---

*Thank you for being part of this. — The ZAM Community*
