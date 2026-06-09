# Increment Status

This file is the canonical implementation index. Individual increment documents
record proposals and retrospectives; their titles and "completed" wording do not
override the evidence in the repository.

| Increment | Status | Implemented evidence | Remaining acceptance work |
| --- | --- | --- | --- |
| 1 - Kernel and observation | Implemented | `src/kernel/models`, `scheduler`, `recall`, `observation`; CLI and JSON bridge; integration tests | Continue hardening migrations and shell compatibility as behavior expands |
| 2 - Personal kernel, decomposition, connectors | Partial | Cloud-ready database configuration, credentials, repo path resolution, goals, Azure DevOps connector, observation-based skill discovery | General connector contract, active-task priority, and end-to-end multi-repo workflow |
| 3A - Goal-driven stabilization | Partial | CI, goal parser/engine, identity command, repository sync, kernel tests | Automated task proposal and a defined backup/restore workflow |
| 3B - Learning-gated development | Planned, foundations only | Card blocking and prerequisite scheduling exist | PR gates, automatic code review, incident mode, and team governance are not implemented |
| 3C - Proactive symbiosis | Planned, foundations only | Skill discovery and competence analytics exist | Session synthesis, conversational review, competence-aware planning, and learning locks |
| 4 - Organizational hierarchy and policy | Planned | Personal repo path hierarchy is available | Employer/team templates, policy artifacts, privacy enforcement, and policy-aware sessions |
| 5 - Installation harness | Partial | Guided workspace setup, OS installers for local LLM runners, workspace publishing | Distribution of the ZAM CLI itself through OS package managers and upgrade/uninstall validation |
| 6 - Hardware setup and global onboarding | Implemented with corrected scope | Hardware profiling, runner installation, model-aware settings, global skills, explicit monitored-session helpers | FastFlowLM model download remains first-use behavior; add platform installation tests |
| 7 - Locale-aware recall | Partial product coverage | Seven-locale CLI i18n, locale detection/settings, localized LLM generation and evaluation | Desktop static chrome currently has dedicated English/German copy and English fallback for five locales |
| 8 - Tauri recall studio | Implemented, release verification pending | Tauri UI, secure CLI bridge, self-contained CLI/Node resources, CSP, native release matrix | Exercise the release workflow from a tag and add automated frontend interaction tests |
| 9 - Release hardening | In progress | See `9 - Release Hardening & Distribution Integrity.md` | Complete the acceptance checklist and validate CI on GitHub |
| 10 - Async database providers and Turso Sync | Planned | Windows ARM64 local SQLite and an internal database contract provide the migration foundation | Phase 0 ARM64 release closure (`zam-core` 0.3.7), then async kernel migration, remote HTTP Turso as the primary cloud mode, local-to-cloud promotion, and removal of native libSQL; Turso Sync parked while offline-first stays a non-goal |

## Current Product Sequence

1. Finish Increment 9 and publish a signed/test release candidate, including
   `zam-core` 0.3.7 so npm installs work on Windows ARM64.
2. Close the user-visible gaps in Increment 7 and add desktop interaction tests.
3. Implement the missing generalized connector and active-task workflow from Increment 2.
4. Select exactly one Increment 3 product direction before implementing more
   proactive or governance behavior.
5. Implement Increment 10 when cloud database access from every architecture
   becomes the active product priority.

The files named `Josefczak.thoughts` and `Gemini.retro` are planning inputs, not
separate shipped increments. The three numbered Increment 3 specifications are
alternative product directions and must not be reported as one completed scope.
