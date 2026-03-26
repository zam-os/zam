# Convivial tools

**Goal**: Technology amplifies human capability without creating new dependencies. The tool serves the person — never the reverse.

In 1973, Ivan Illich coined the term [*convivial tools*](https://en.wikipedia.org/wiki/Tools_for_Conviviality): tools that expand what a person can do without restricting what they are allowed to do. A bicycle is convivial — it multiplies human mobility without requiring a license, a mechanic, or a subscription. A car is less convivial — it demands roads, fuel, insurance, and eventually reshapes the city around itself until walking becomes impractical.

Most AI tools today are anti-convivial. They centralize capability, create dependency, and make the user a consumer of outputs they cannot understand, reproduce, or verify. ZAM aims to be the bicycle: a tool you can understand, own, repair, and eventually outgrow.

## Components

1. **No vendor lock-in** — The kernel has zero LLM dependencies. Any AI CLI can integrate through the [bridge protocol](../../beliefs/openness/bridge-protocol/). The person's learning data never leaves their machine. If every AI company disappeared tomorrow, the SQLite file and the CLI still work.
2. **Inspectable state** — Every piece of data the system holds is visible to the user: tokens, cards, stability, difficulty, review history, agent skills. There is no hidden model, no opaque recommendation engine, no engagement-optimized dark pattern. See [Illich's principle of transparency](https://en.wikipedia.org/wiki/Tools_for_Conviviality).
3. **Repairable and forkable** — The system is open source (Apache 2.0), written in a common language (TypeScript), stored in a single SQLite file. A person with basic programming skill can read the code, fix a bug, or fork the project for their community's needs. This is what the README calls *Social Forking*.
4. **Appropriate scale** — The tool fits the person, not the institution. It runs locally, starts instantly, requires no server. This echoes [E.F. Schumacher's "Small is Beautiful"](https://en.wikipedia.org/wiki/Small_Is_Beautiful) — technology at a human scale, not technology that demands humans scale to it.
5. **The tool should become unnecessary** — The ultimate success of ZAM is a person who no longer needs it. If the person has internalized the knowledge, if their competence is genuine, the tool has done its job. This distinguishes a convivial tool from an addictive one.

## Intellectual roots

- [Ivan Illich, "Tools for Conviviality"](https://en.wikipedia.org/wiki/Tools_for_Conviviality) (1973) — The foundational text. A convivial tool is one that gives each person the maximum power to shape their world with minimum dependence on others.
- [E.F. Schumacher, "Small is Beautiful"](https://en.wikipedia.org/wiki/Small_Is_Beautiful) (1973) — Economics and technology at a human scale. "Any intelligent fool can make things bigger, more complex, and more violent. It takes a touch of genius — and a lot of courage — to move in the opposite direction."
- [Matthew Crawford, "The World Beyond Your Head"](https://en.wikipedia.org/wiki/The_World_Beyond_Your_Head) (2015) — Attention as a scarce resource that tools should protect, not exploit.
