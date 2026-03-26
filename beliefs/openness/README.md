# Openness

**Belief**: The learning kernel must not depend on any specific AI vendor, language, or interface. Symbiosis is a universal pattern — the tools that enable it should be universally accessible.

## Components

1. **[Bridge protocol](bridge-protocol/)** — A stable JSON contract allows any AI to integrate with the kernel.
2. **AI-agnostic kernel** — The core engine (`src/kernel/`) has zero LLM dependencies. All learning logic is pure computation.
3. **Language-agnostic interface** — JSON over stdin/stdout works from any programming language.
4. **Forward-compatible contracts** — Adding fields to the protocol is safe. Removing or changing existing fields breaks integrations and requires a belief-level discussion.

## Related beliefs

- [Symbiosis](../symbiosis/) is the *why* — openness serves the goal of universal human-AI collaboration.
- [Bidirectional learning](../symbiosis/bidirectional-learning/) requires that agent skills be portable across AI backends.
