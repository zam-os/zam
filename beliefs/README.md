# Don't just automate — Elevate

ZAM (Bavarian: "together") is built on the belief that as AI becomes more capable, the right response is not to hand over control, but to **deepen human capability through collaboration**.

This folder captures the premises on which ZAM is built. They are beliefs, not proven truths. They represent the current understanding of the group creating ZAM and will evolve as knowledge and discoveries challenge them.

## Beliefs

1. **[Symbiosis](symbiosis/)** — Human and AI amplify each other through collaboration that evolves with competence.
2. **[Forgetting](forgetting/)** — Forgetting is a valuable signal that reveals where foundations are weak.
3. **[Knowledge structure](knowledge-structure/)** — Knowledge is a shared graph; learning is a personal journey through it.
4. **[Learning in context](learning-in-context/)** — Real work is the most effective classroom.
5. **[Openness](openness/)** — The learning kernel must not depend on any specific AI vendor or interface.

## External foundations

ZAM builds on established science. These are not restated here — they are referenced where needed:

- [Spaced repetition](https://en.wikipedia.org/wiki/Spaced_repetition) — reviewing at expanding intervals strengthens long-term retention
- [FSRS-5](https://github.com/open-spaced-repetition/fsrs4anki) — the scheduling algorithm (replaces SM-2)
- [Bloom's taxonomy](https://en.wikipedia.org/wiki/Bloom%27s_taxonomy) — six levels of cognitive complexity
- [Miller's law](https://en.wikipedia.org/wiki/Miller%27s_law) — human working memory holds 7 ± 2 chunks
- [Interleaving effect](https://en.wikipedia.org/wiki/Interleaving_(learning)) — mixing topics during practice strengthens discrimination
- [Desirable difficulty](https://en.wikipedia.org/wiki/Desirable_difficulty) — effortful retrieval builds stronger memory

## How to read this folder

Each subfolder contains a `README.md` stating a belief and decomposing it into at most 7 components. Components that are themselves beliefs link to child folders. Components that are established knowledge link to external sources.

**For agents**: Start here. Load top-level beliefs first. Expand into children only when the task requires deeper understanding.

**For humans**: Browse top-down. Each level should fit in working memory. Follow links to go deeper.

## How to change a belief

A belief change is a worldview change. It may invalidate code, tests, and other beliefs.

1. Open a PR that modifies the belief file(s).
2. Trace which code and sibling beliefs depend on the changed belief.
3. Include necessary code changes in the same PR or a linked follow-up.
4. Reviewers focus on the conceptual change first, code second.
