# ADR-0007: Locale-Aware Active Recall

**Status:** Implemented
**Date:** 2026-06-20
**Deciders:** Thomas (project owner)

---

## Context

Adding operating system locale detection, multi-language override capability, translation support for various locales, and LLM translation consistency.

## Decisions

- Operating-system locale detection on Windows, macOS, and Linux.
- Explicit locale configuration through `zam settings locale`.
- CLI translations for English, German, Spanish, French, Portuguese, Chinese, and Japanese.
- Locale-aware local-LLM question generation and answer evaluation.
- English fallback when a translation key is unavailable.

## Evidence

- `src/kernel/system/locale.ts`
- `src/kernel/system/i18n.ts`
- `src/cli/commands/settings.ts`
- `src/cli/llm/client.ts`
- `tests/kernel/locale.test.ts`
