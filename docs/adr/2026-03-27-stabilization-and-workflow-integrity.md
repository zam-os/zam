# Stabilization and Workflow Integrity

**Status:** Implemented
**Deciders:** Thomas (project owner)

---

## Context

Adding CI validation, integration tests, prerequisite check refinements, review maintenance, and multi-client skill distribution.

## Decisions

- Continuous integration for linting, type checking, builds, and tests.
- Database-backed integration tests for tokens, cards, reviews, and blocking.
- Prerequisite cycle detection.
- A shared database lifecycle wrapper for CLI commands.
- Review-time token maintenance actions.
- Synced agent-skill distributions for supported agent clients.
- Repository-level context settings and documentation alignment.

## Evidence

- `.github/workflows/ci.yml`
- `tests/integration/token-card-review.test.ts`
- `tests/kernel/review-maintenance.test.ts`
- `src/cli/commands/shared/db.ts`
- `src/cli/review-actions.ts`
- `.agent/skills/zam/SKILL.md`
- `.agents/skills/zam/SKILL.md`
- `.claude/skills/zam/SKILL.md`
