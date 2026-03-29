# Vision: Learning-Gated Development & Operational Safety

## One-Sentence Vision
Introduce quality gates that tie code changes to proven human understanding, differentiate between relaxed development and high-pressure incident response, and ensure that AI acceleration never outpaces human comprehension.

## Why this is the right next increment
Increment 2 connected ZAM to real workflows — task boards, cloud sync, sessions with repetition. But the system still trusts the human to self-regulate learning. In practice, teams using agentic AI accelerate so fast that developers stop reading and understanding the code their agents produce. When disaster strikes — an outage, an AI-introduced bug, or the AI itself becoming unavailable — the disconnected human is paralyzed. ZAM must prevent this by making comprehension a prerequisite for progress, not an afterthought.

## The Scenario That Must Not Happen
A DevOps team delegates increasingly to AI agents. Confidence in the agent grows. Confidence in their own understanding shrinks. One day, a production incident occurs. The agent is unavailable, or worse, the agent caused it. The human stares at code they don't recognize. Stress peaks. The brain shuts down. The person who should fix the problem cannot even begin. In extreme cases, this disconnection endangers not just the system, but the person. ZAM exists to ensure this scenario never materializes.

## Significant Changes (Max 7)

### 1. Two Operational Modes
ZAM recognizes two fundamentally different working contexts:

- **Creation mode** (relaxed, joyful): Building new increments, features, improvements. Time is not the enemy. Learning gates apply. Agentic AI fully supports development.
- **Incident mode** (high-pressure): Keeping systems alive during outages, reducing impact, minimizing mean time to repair. ZAM steps back from resource manipulation. It advises — tells the human what script, tool, or command it would use — but does not execute. It monitors what the human does and logs learning topics for later review. Tools built during calm creation mode are the safety net here.

The boundary: ZAM will *tell* you what to do, but won't *do* it during incidents. After the incident, the next learning session reviews what happened and what could be improved.

### 2. Learning-Gated Pull Requests
Code changes follow a comprehension-driven workflow:

- **Draft PR gate (Bloom level 2 — Understanding)**: The ZAM agent verifies that the author can explain what the code does. All concepts in the change are discovered and logged as learning tokens. Cards exist for each concept. The author's cards must reach Bloom level 2 before the Draft PR is created.
- **Published PR gate (Bloom level 3 — Applying)**: When all concept cards reach Bloom level 3, the Draft PR is published and becomes visible to the team. Notifications go out to request reviews.
- **Reviewer gate (Bloom level 3)**: Reviewers who want to approve must demonstrate Bloom level 3 understanding of the changed concepts. The review session is itself a ZAM learning session — discussion and comprehension happen on the reviewer's side.
- **Merge gate**: At least 3 parties approve — 2 humans and 1 agent. Agent review uses 2–3 different models for diversity. Agent review comments must be addressed by humans who prove understanding, not just acknowledged.

After merge: at least 3 human team members (author + 2 reviewers) have proven understanding of the change.

### 3. Automatic Agent Code Review
When a Draft PR is created, ZAM automatically triggers code review by 2–3 agent reviewers using different models. Review comments become learning material — the human must demonstrate they understand the concern before resolving the comment. This is not a rubber stamp; it's a teaching moment.

### 4. Human-Comprehensible Code as Highest Design Goal
Every piece of code that ZAM helps produce must be human-comprehensible. This means:
- 7-tile decomposition (Miller's law) applied to modules, functions, and abstractions
- No clever tricks that optimize for machine efficiency at the cost of human readability
- Architecture documents do not need to follow the 7-tile limit — they describe the full picture. But each *unit of code* that a human must understand does.

### 5. ZAM Advisory Mode During Incidents
During incident response, ZAM operates in advisory-only mode:
- Answers questions using its full knowledge of company context, team context, products, services, and tools
- Suggests what script, tool, or command to use — but does not execute
- Monitors the operator's actions and logs them as learning material
- After the incident (after rest), the next ZAM session reviews what happened: what went well, what could improve, what new tokens emerged

### 6. Team Velocity Governance
Teams agree on rules that prevent AI-accelerated development from outpacing human understanding:
- No code merged without 3 approvals (2 human + 1 agent minimum)
- Learning tokens for every code change, with Bloom-level gates on PR lifecycle
- ZAM talks through code changes with the author before any PR is created
- Reviewers must complete a ZAM learning session on the change before approving

### 7. Concept Discovery from Code Changes
When a code change is made, ZAM analyzes the diff to discover concepts exercised:
- New patterns, libraries, or architectural decisions become learning tokens
- Existing tokens referenced in the change get their cards updated
- The concept map grows organically from real development, not from manual registration

## Success Criteria
1. A Draft PR cannot be created until the author's concept cards reach Bloom level 2.
2. A Draft PR cannot be published until all concept cards reach Bloom level 3.
3. Reviewers cannot approve until they demonstrate Bloom level 3 on the changed concepts.
4. During incident mode, ZAM advises but does not execute commands.
5. After an incident, the next session surfaces learning topics from the monitored actions.
6. Agent code review is triggered automatically on Draft PR creation, using multiple models.
7. At least 3 humans understand every merged change.
