# ZAM Templates & Instances

> See also: [multi-repo-context.md](concepts/multi-repo-context.md) for the philosophical model
> of repositories as the universal unit of planning for individuals, communities, and organisations.

---

## The Core Distinction

**Templates** are DNA. They define structure, identity contracts, config schemas, and setup
instructions. They contain no living data — no actual beliefs, no goals in progress, no
learning history. A template is a precise, repeatable blueprint.

**Instances** are living organisms. They are created from a template and immediately begin
accumulating data: beliefs committed to git, goals tracked across conversations, learning
history in the database. Every committed change is a conscious decision; the git history
is the approval trail.

This separation is intentional: templates evolve slowly (they are published and versioned
like software), while instances evolve continuously (they are personal or communal
property, never meant to be kept in sync with the template after creation).

---

## Two Template Families

ZAM has two parallel template families, each targeting a different unit of human organisation:

```
zam-core  (npm package — the learning kernel)
    │
    ├── zam-personal      GitHub template → personal instances
    │     └── YourName/zam-YourName   (private)
    │
    └── zam-community     GitHub template → community instances
          └── zam-os/zam-dev           (public — developer community)
          └── AcmeCorp/zam-backend     (private — team community)
          └── …
```

Personal instances belong to one person. Community instances belong to a group.
Communities and personal instances are peers in the repo graph — neither owns the other.
A person *joins* a community by listing it in their personal config; a community *records*
its members in its own `members/` directory.

---

## Personal Template (`zam-personal`)

### Purpose

Bootstraps a private ZAM instance for one person. Provides the structure for beliefs,
goals, and non-secret configuration. All fast-changing learning data lives outside the
repo in `~/.zam/zam.db`.

### File structure

```
zam-personal/           ← GitHub template repo
├── CLAUDE.md           ← Context for Claude Code before skill files exist
├── README.md           ← How to create and set up a personal instance
├── .gitignore          ← Excludes node_modules/, .zam/*.db
├── package.json        ← { "dependencies": { "zam-core": "^x.y.z" } }
├── .zam/
│   └── config.yaml     ← Non-secret instance config (see schema below)
├── beliefs/
│   └── README.md       ← What beliefs are; Miller's number (max 7)
├── goals/
│   └── README.md       ← What goals are; decomposition model
└── .claude/
    └── skills/
        └── setup/
            └── SKILL.md ← /setup onboarding skill (static, always present)
```

After running `/setup`, `zam-core` distributes its own skill file:

```
.claude/skills/zam/SKILL.md    ← from node_modules/zam-core/.claude/skills/zam/
.gemini/skills/zam/SKILL.md    ← from node_modules/zam-core/.gemini/skills/zam/
```

### Personal config schema (`.zam/config.yaml`)

```yaml
# ZAM Personal Instance Configuration
# Non-secret values only. Secrets are obtained via auth flows during setup.
# This file is git-tracked. Never put tokens, passwords, or PATs here.

identity:
  user_id: ""              # lowercase, no spaces (e.g. thomas)

communities:               # communities this person belongs to
  - url: ""                # GitHub URL of the community instance repo
    role: ""               # member | contributor | maintainer | developer

turso:                     # leave empty for local-only
  url: ""                  # libsql://db-name.region.turso.io
  db: ""                   # database name (for token creation)

connectors:
  ado:
    org_url: ""            # https://dev.azure.com/yourorg
    project: ""            # project name
```

---

## Community Template (`zam-community`)

### Purpose

Bootstraps a shared ZAM instance for a group — a team, an open-source project, a
professional community, or any other purposeful collective. Communities define shared
beliefs, goals, and optionally a list of source repositories that members should have
cloned locally.

A community instance is typically public (its beliefs and goals are the community's
published identity) but may be private for internal teams.

### File structure

```
zam-community/          ← GitHub template repo
├── CLAUDE.md           ← Context for Claude Code
├── README.md           ← How to create and set up a community instance
├── .gitignore          ← Excludes node_modules/, .zam/*.db
├── package.json        ← { "dependencies": { "zam-core": "^x.y.z" } }
├── .zam/
│   └── config.yaml     ← Non-secret community config (see schema below)
├── beliefs/
│   └── README.md       ← Community's shared worldview
├── goals/
│   └── README.md       ← Community's shared objectives
├── members/
│   └── README.md       ← Membership model; how to join
└── .claude/
    └── skills/
        └── setup/
            └── SKILL.md ← /setup skill (community-aware)
```

### Community config schema (`.zam/config.yaml`)

```yaml
# ZAM Community Instance Configuration
# Non-secret values only. This file is git-tracked.

identity:
  community_id: ""       # slug (e.g. zam-dev, acme-backend)
  type: community

repos:                   # source repositories members should clone
  - url: ""              # GitHub URL (e.g. github:zam-os/zam)
    description: ""      # what this repo is
    link: true           # true = npm link after cloning (for zam-core source)
```

---

## Setup Protocol

The `/setup` skill in a personal instance follows this sequence:

```
1. Read .zam/config.yaml
2. Detect platform (macOS / Windows)
3. Install Node.js if missing
4. npm install  (installs zam-core)
5. zam-core setup  (distributes skill files, initialises ~/.zam/zam.db)
6. Set identity (zam whoami --set <user_id>)
7. For each entry in communities[]:
     a. git clone <community.url> to a sibling directory (if not already present)
     b. Read <community>/.zam/config.yaml
     c. For each repo in community.repos[]:
          - git clone <repo.url> to a sibling directory (if not already present)
          - If repo.link = true: npm install && npm link in that repo,
            then npm link zam-core in the personal instance
8. Turso cloud sync (if turso.url configured)
9. Azure DevOps connector (if ado.org_url configured)
10. Set goals directory
11. Commit distributed skill files
```

This means the personal setup skill does **not** hardcode community-specific logic.
The community's config drives what gets cloned and linked. Adding a new community
to a personal instance is as simple as appending to `communities:` and re-running
`/setup`.

---

## The Developer Community (`zam-dev`)

The first community instance is the developer community for ZAM itself. It is created
from `zam-community` and represents the group of people actively building the kernel.

```
zam-os/zam-dev/.zam/config.yaml:

identity:
  community_id: zam-dev
  type: community

repos:
  - url: github:zam-os/zam
    description: The zam-core learning kernel
    link: true
  - url: github:zam-os/zam-personal
    description: Personal instance template
    link: false
  - url: github:zam-os/zam-community
    description: Community instance template
    link: false
```

A developer member's personal config lists this community:

```
communities:
  - url: github:zam-os/zam-dev
    role: developer
```

When `/setup` runs on such a personal instance, it automatically clones all three
repos and sets up the `npm link` chain — no manual steps, no tribal knowledge.

---

## Skill Distribution

Skill files always travel with the package that defines them:

| Package / repo | Owns skill group | Distributes via |
|----------------|-----------------|-----------------|
| `zam-core` | `.claude/skills/zam/` | `zam setup` (copies from `node_modules/zam-core/`) |
| `zam-community` | `.claude/skills/setup/` | Static in template (always present before setup runs) |
| Future: `zam-devops` | `.claude/skills/devops/` | `devops setup` (copies from `node_modules/zam-devops/`) |

The naming convention `<ai-cli>/skills/<group>/SKILL.md` provides natural namespacing.
No central registry is needed — each package owns its subdirectory.

---

## Versioning & Updates

Templates evolve slowly and deliberately. After creating an instance from a template,
the instance is independent — it does not automatically receive template updates.

To pull in template improvements:
- **Skill files**: `npm install && zam setup --force` (updates distributed skills)
- **Config schema**: manually compare with the template's `.zam/config.yaml` and add new fields
- **Structure**: manually add new directories (e.g. `members/`) if the template added them

This is intentional. An instance is personal or communal property. Updates are a
conscious choice, not an automatic push.
