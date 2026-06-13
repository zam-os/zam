# Increment 7: Locale-Aware Active Recall

## Implemented

- Operating-system locale detection on Windows, macOS, and Linux.
- Explicit locale configuration through `zam settings locale`.
- CLI translations for English, German, Spanish, French, Portuguese, Chinese,
  and Japanese.
- Locale-aware local-LLM question generation and answer evaluation.
- English fallback when a translation key is unavailable.

## Evidence

- `src/kernel/system/locale.ts`
- `src/kernel/system/i18n.ts`
- `src/cli/commands/settings.ts`
- `src/cli/llm/client.ts`
- `tests/kernel/locale.test.ts`
