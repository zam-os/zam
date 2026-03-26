# Subsidiarity

**Goal**: Knowledge, data, and decisions belong at the most local level that can handle them. Nothing should be centralized that can remain personal. Nothing should be personal that the community needs to share.

[Subsidiarity](https://en.wikipedia.org/wiki/Subsidiarity) is a principle from [Catholic social teaching](https://en.wikipedia.org/wiki/Catholic_social_teaching): higher-order bodies should not take over what lower-order bodies can accomplish themselves. A parish does not need Vatican approval to organize a festival. A national government should not micromanage municipal parks. The principle protects both autonomy and dignity — it says that people closest to a problem are usually best equipped to solve it.

In software, subsidiarity means: your data stays on your machine unless *you* decide to share it. Your learning progress is not uploaded to a cloud, not aggregated for analytics, not sold as training data. The system respects the boundary between what is yours and what is shared.

## Components

1. **Local-first storage** — All learning data lives in `~/.zam/zam.db`, a single SQLite file owned by the user. No server, no account, no network required. The user can back it up, move it, inspect it with any SQLite tool.
2. **Tokens are shared, cards are personal** — A [token](../../beliefs/knowledge-structure/token-card-separation/) (concept) can be shared across learners. A card (your relationship to that concept) belongs only to you. This mirrors the subsidiarity distinction: knowledge itself is common, but your learning journey is private.
3. **Community by consent** — In Phase 2, agents communicate across users — but only within [accredited communities](https://en.wikipedia.org/wiki/Subsidiarity_(Catholicism)) the user has joined. Your parish, your employer, your club. Not a global marketplace that commodifies your learning profile.
4. **Decisions at the right level** — What to learn next: the individual decides (with the agent's suggestion). What skills the community needs: the community decides. What standards to follow: the institution decides. Each level governs its own domain. See [Elinor Ostrom's polycentric governance](https://en.wikipedia.org/wiki/Elinor_Ostrom).
5. **No extraction** — The system does not extract value from the user's data. There is no freemium model where the free tier serves as data collection. The local-first architecture is not a limitation — it is a *decision* rooted in subsidiarity.

## Intellectual roots

- [Catholic social teaching](https://en.wikipedia.org/wiki/Catholic_social_teaching) — Subsidiarity as a foundational principle, alongside solidarity and human dignity. Codified in [*Rerum Novarum*](https://en.wikipedia.org/wiki/Rerum_novarum) (1891) and [*Quadragesimo Anno*](https://en.wikipedia.org/wiki/Quadragesimo_anno) (1931).
- [Elinor Ostrom, "Governing the Commons"](https://en.wikipedia.org/wiki/Governing_the_Commons) (1990) — Communities can manage shared resources without centralized authority or privatization. Nobel Prize 2009.
- [Local-first software](https://www.inkandswitch.com/local-first/) (Ink & Switch, 2019) — A modern articulation of the same principle in software architecture: ownership, offline capability, longevity.
