# ADR-0003: Personal Workflow Foundations

**Status:** Implemented
**Date:** 2026-06-20
**Deciders:** Thomas (project owner)

---

## Context

Establishing default user identity, configuration of repository paths, parsing/executing goals, Azure DevOps connection, and skill discovery.

## Decisions

- A default user identity through `zam whoami`.
- Configurable personal, team, and organization repository paths.
- A markdown goal parser and goal engine.
- Azure DevOps work-item discovery during session start.
- A repetition-first session flow followed by task selection.
- Observation-based discovery of reusable command-sequence skills.
- Personal workspace templates and `zam workspace publish`.

## Evidence

- `src/cli/commands/whoami.ts`
- `src/kernel/system/repos.ts`
- `src/kernel/goals/`
- `src/kernel/connectors/azure-devops.ts`
- `src/cli/commands/session.ts`
- `src/kernel/observation/skill-discovery.ts`
- `templates/personal/`
