# Vision: Organizational Hierarchy & Policy Enforcement

## One-Sentence Vision
Introduce company and team ZAM instances with enforceable policies, creating a hierarchy where organizational agreements flow down to individual learning while keeping sensitive data private.

## Why this is the right next increment
Increment 3 establishes learning-gated development and operational safety for a single team. But teams exist within organizations. The rules a team agrees on (PR approval gates, Bloom-level requirements, incident protocols) need to live somewhere durable and enforceable — not in a wiki that nobody reads, but in a structure that ZAM actively follows. Similarly, a company may have overarching policies that apply to all teams. This increment introduces the organizational layers that make ZAM a team and company tool, not just a personal one.

## Significant Changes (Max 7)

### 1. Company Instance — `zam-employer` Template
A new public template `zam-os/zam-employer` for creating private company-wide ZAM instances. The instantiated repo (e.g. `CompanyName/zam-company`) is **private** — it contains:
- **`policies/`** — Company-wide rules that ZAM enforces (PR approval requirements, incident protocols, learning mandates)
- **`beliefs/`** — Organizational beliefs (company values that influence how ZAM behaves)
- **`goals/`** — Company-level objectives that decompose into team goals
- **`.zam/config.yaml`** — Company-wide non-secret configuration

**Privacy is paramount.** These repos contain personal data (who understands what, learning progress, team assignments) that is appropriate inside the company but would be a severe incident if leaked publicly.

### 2. Team Instance — `zam-private-team` Template
A new public template `zam-os/zam-private-team` for creating private team-level ZAM instances. The instantiated repo (e.g. `CompanyName/zam-devops-team`) is **private** — it contains:
- **`policies/`** — Team-specific rules (may extend or tighten company policies)
- **`beliefs/`** — Team beliefs about how they work
- **`goals/`** — Team objectives that decompose into individual tasks
- **`.zam/config.yaml`** — Team configuration, references to company instance

### 3. Policies as a New Artifact Type
Alongside beliefs (what we hold true) and goals (what we pursue), introduce **policies** (rules we enforce):
- Policies are markdown files in `policies/` with structured frontmatter
- ZAM reads and enforces policies during sessions, PR workflows, and incident response
- Policies cascade: company policies apply to all teams; team policies apply to all members
- A policy change requires the same deliberate approval process as a belief change

Example policies:
- `policies/pr-approval.md` — "Minimum 2 human + 1 agent approval for merge"
- `policies/bloom-gates.md` — "Author: Bloom 2 for Draft, Bloom 3 for Publish. Reviewer: Bloom 3 for Approve."
- `policies/incident-mode.md` — "ZAM advisory-only during incidents. No resource manipulation."

### 4. Hierarchy: Company → Team → Personal
The ZAM instance hierarchy:
- **Company** sets baseline policies and beliefs
- **Team** inherits company policies, may add stricter team-specific rules
- **Personal** inherits team policies, holds individual learning state and personal beliefs

ZAM resolves policies by walking up the hierarchy. A personal instance knows which team it belongs to, which knows which company it belongs to.

### 5. Privacy Boundaries
Clear rules about what data flows where:
- **Personal data** (learning progress, card states, review history) stays in the personal instance and the shared database. Visible to the team/company but never public.
- **Team data** (who understands what, aggregate competence) stays in the team instance. Visible to company but never public.
- **Company data** (policies, organizational beliefs) stays in the company instance. Never public.
- **Templates** (`zam-employer`, `zam-private-team`) are public — they contain no data, only structure.

### 6. Policy-Aware Sessions
ZAM sessions respect the active policy stack:
- In creation mode: enforce learning gates per policy before allowing PR creation
- In incident mode: switch to advisory-only per incident policy
- During review: verify reviewer meets the Bloom-level threshold defined by policy
- Policy violations surface as warnings, not silent bypasses

### 7. Cross-Instance Visibility
Within privacy boundaries, ZAM provides visibility:
- Team leads can see aggregate competence across team members (not individual card details, but "does the team collectively understand service X?")
- Company can see which teams have coverage for critical systems
- Individuals can see their own standing relative to team expectations

## Success Criteria
1. `zam-employer` and `zam-private-team` templates exist as public repos in `zam-os`.
2. Private instances created from templates contain `policies/`, `beliefs/`, `goals/`, and `.zam/config.yaml`.
3. A policy defined at company level is enforced in team and personal ZAM sessions.
4. A team policy can extend but not weaken a company policy.
5. Personal data never appears in public repos or templates.
6. ZAM sessions read and enforce the active policy stack.
7. Aggregate competence visibility works within privacy boundaries.
