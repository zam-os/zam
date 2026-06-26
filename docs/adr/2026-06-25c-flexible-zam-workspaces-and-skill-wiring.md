# Flexible ZAM Workspaces and Skill Wiring

**Status:** Proposed
**Deciders:** Thomas (project owner)
**Related:**
[2026-03-26-personal-workflow-foundations.md](2026-03-26-personal-workflow-foundations.md) ·
[2026-05-30b-hardware-setup-and-agent-distribution.md](2026-05-30b-hardware-setup-and-agent-distribution.md) ·
[2026-06-13b-approachable-setup-and-self-update.md](2026-06-13b-approachable-setup-and-self-update.md)

---

## Context

ZAM started from a personal repository model: a personal instance contains
human-authored knowledge files, and `zam setup` copies the ZAM skill into that
repository for agent use.

Real use is broader:

- a team may already have a central knowledge repo;
- that repo may live in Azure DevOps rather than GitHub;
- users may want personal, team, family, community, and organization workspaces;
- ZAM should work in an existing repo instead of requiring a new `zam-personal`
  or `zam-private-team` clone;
- Copilot and Claude need to be supported first.

Current code has `repo.personal`, `repo.team`, and `repo.org` settings plus
`personal.workspace_dir`, but this is a fixed shape and does not describe skill
installation state, source-control provider, or arbitrary workspace kinds.

## Decision

Introduce a flexible workspace registry.

Each workspace record has:

- `id`, for example `personal`, `team`, `family`, `community-pgr`, or
  `cops-management`;
- `label`;
- `kind`: `personal | team | family | community | organization | custom`;
- `path`;
- optional `sourceControl`: `github | azure-devops | git | none`;
- optional `knowledgeScopes`, such as `beliefs`, `goals`, `concepts`, or
  `foundation`;
- optional default agent/harness.

Workspace paths are machine-local because directory layouts differ between
machines. The registry therefore lives in `~/.zam/config.json`, while the
workspace contents remain normal files in the selected repositories.

`zam setup` gains an explicit target mode so it can wire ZAM into existing
repositories:

```powershell
zam workspace add cops-management --kind team --path C:\src\Cops.Management --source-control azure-devops
zam workspace setup cops-management --agents copilot,claude
```

Skill setup is non-destructive:

- copy or refresh `.claude\skills\zam\SKILL.md` for Claude Code and
  Copilot CLI project skills;
- copy or refresh `.agents\skills\zam\SKILL.md` for Codex-style repo skills;
- preserve existing `CLAUDE.md`, `AGENTS.md`, and
  `.github\copilot-instructions.md`;
- create or refresh only clearly marked ZAM instruction blocks;
- support `--dry-run` and `--force`.

The installed ZAM package or desktop resource bundle remains the source of skill
files. A source checkout is not required.

## Consequences

**Easier**

- Existing team repositories can become ZAM workspaces.
- Azure DevOps repositories are supported because skill wiring only needs local
  files and Git-compatible paths.
- Personal and shared knowledge can live in different workspaces without
  forcing one repository layout.

**Harder**

- Setup must avoid clobbering existing agent instructions.
- Host-specific invocation differs. Not every agent exposes a literal `/zam`
  slash command; the skill must be installed and documented according to each
  host's supported mechanism.
- Goal and belief resolution must evolve from fixed personal/team/org settings
  toward workspace records, while preserving compatibility.
