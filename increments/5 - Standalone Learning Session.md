# Increment 5: Standalone Learning Session

## Implemented

- A spoiler-free `zam learn` console flow.
- Answer capture before concept and source context are revealed.
- In-process review actions without per-card shell commands.
- Local-LLM question generation and answer evaluation.
- Source-link resolution for local files, web pages, and dynamic searches.
- Token editing, deprecation, and deletion from the review flow.

## Evidence

- `src/cli/commands/learn.ts`
- `src/cli/review-actions.ts`
- `src/cli/llm/client.ts`
- `src/kernel/recall/reference-resolver.ts`
- `tests/cli/learn-format.test.ts`
- `tests/kernel/reference-resolver.test.ts`
