# Josefczak's Thoughts: Vision for the Next Increment

**Author**: Thomas Josefczak
**Date**: 2026-03-27

## Strategic Vision: Stabilization & Usability
The core goal of the next increment is to move from a set of powerful components to a stable, user-centric product. This involves both technical stabilization and significant usability improvements.

## 1. The Goal Engine
ZAM should go beyond atomic "tokens" and support long-term, high-level learning goals.
- **Decomposed Goal Trees**: Goals should be persisted as markdown files, using a hierarchical structure similar to the `beliefs/` system.
- **Persistence & Evolution**: These goals are persistent and should be refined with the help of the ZAM agent.
- **Prioritization**: High-level goals (e.g., "Master Backend Architecture") should decompose into actionable learning paths and tokens.

## 2. Multi-Repo Context & Organizational Awareness
ZAM should understand the user's professional and personal environment by reading settings that point to:
- **Personal Repo**: The user's private learning and knowledge base.
- **Team Repo**: Shared skills and patterns used by the team.
- **Organization Repo**: A summarized view of company-wide knowledge, wiki crawls, and OKRs.
- **Automatic Discovery**: The ZAM agent should be preset to use high-context, high-power models to process these repositories without artificial cost constraints.

## 3. Team Integration & Product Management
Thomas proposes testing ZAM in a real-world scenario by:
- **Product Owner Trial**: Convincing his team (at least 3 members including himself) at DocuWare to adopt ZAM.
- **Quarterly Retrospectives**: Evaluating the experience and the impact on team performance after each quarter.
- **Scrum Board Integration**: Implementing a skill in the team repo that knows how to access the scrum board and individual work items.

## 4. Proactive Coworking & Learning
Usability is significantly increased by making ZAM proactive:
- **Automatic Task Fetching**: Automatically identify the next unblocked task for the user.
- **Session Proposals**: At the start of a session, ZAM should propose the next logical task based on the current sprint and the user's learning goals.
- **Smart Priority**: Present options based on a combination of task usefulness and the need for repetition (due deck) to maintain competence.

## 5. ZAM Backup
To ensure data portability and persistence:
- **Automatic Database Export**: At the end of a session, ZAM should optionally copy its database state (zam-backup) to a designated folder in the user's private personal repo.
- **Setting-Driven**: This behavior should be configurable through the user settings.
