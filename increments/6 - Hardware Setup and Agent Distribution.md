# Increment 6: Hardware Setup and Agent Distribution

## Implemented

- Guided workspace initialization with `zam init`.
- Hardware and operating-system profiling.
- FastFlowLM and Ollama installation support.
- Model-aware local-LLM configuration.
- Agent-skill distribution through `zam setup`.
- Explicit monitored-session shell helpers.
- Workspace publication to a GitHub repository.

## Evidence

- `src/cli/commands/init.ts`
- `src/cli/commands/setup.ts`
- `src/cli/commands/workspace.ts`
- `src/kernel/system/profiler.ts`
- `src/kernel/system/installer.ts`
- `src/kernel/system/hooks.ts`
- `tests/cli/setup.test.ts`
- `tests/kernel/system.test.ts`
