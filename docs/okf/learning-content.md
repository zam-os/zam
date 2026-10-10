---
type: architecture
title: Learning Content
description: The Learning Content page opens on Lern-Karten, three lists of tokens and cards, and Quellen shows one workspace, folder, or curriculum at a time.
tags:
  - studio
  - learning-content
  - cards
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/learning-content.md"
timestamp: 2026-10-10T23:00:00.000Z
---

The Desktop Studio and the shared Studio panel both have a Learning Content page (Lerninhalte). The page opens on **Lern-Karten** (Learning cards). The other area is **Quellen** (Sources).

The actions that create or manage cards from the page header stay on Lern-Karten: a new card, goal import, photo or PDF, file import, library topics, and Bonus while items are kept. Lehrplan, below, keeps the curriculum import and the enrolment of a learning path.

# Lern-Karten

Lern-Karten has three lists. A token is in at most one of them.

**Persönlich** (Personal) is a published token for which this learner has a card, including a card set aside as "not for me". **Nicht gewählt** (Not chosen) is a published token with no card for this learner. Those tokens are grouped by the source link with the fragment removed. A token with no source link sits in the group **Ohne Quelle** (No source); the kernel returns an empty key and an empty name, and the Studio supplies the label. **Unveröffentlicht** (Unpublished) is a token in `draft` or `in_review`, whether or not this learner has a card. A deprecated token is in none of the three. A maintenance token stays in the list that its publication state and card imply.

Search and the category filter apply to the list that is open. The knowledge-context filter applies only while Persönlich is open; on the other two lists it is disabled.

**Wissensnetz (3D)** is the existing graph of the learner's tokens and their prerequisites. Lern-Karten and the dashboard both open it, and Back returns to the page that opened it. The Studio panel has no graph view, so it hides that button.

A published token in Nicht gewählt can be taken as this learner's card. One token is taken on its own, which creates the card and leaves the token as it is. A source group that has a key is taken together: a card is created for each member the learner lacks, and a card already set aside stays set aside. The Ohne Quelle group has an empty key, so those tokens are taken one by one.

# Quellen

Quellen shows one source at a time. The switcher is labeled **Quelle**. It lists every connected workspace, then **Lehrplan** (Curriculum). A picked folder is shown while it is the selected Quelle. The active workspace is what a read returns when nothing is stored, and that read does not write the choice. The choice is remembered on this machine under `learningContent` and does not change `knowledgeMap.repoPath`.

A folder that is not a workspace can be looked at in the Desktop window. Picking it does not add a workspace, link skills, or repair anything. A directory that is missing stays selectable, and the page says so.

For a workspace or a folder, the page lists that directory's OKF articles when `docs/okf/` is present. While **Knowledge map (Alpha)** is on, it also draws that directory's `docs/knowledge-map/map.json` in the view chosen in Settings. While the switch is off, the map stays unloaded and the OKF list remains; one action on the page turns the existing switch on. Settings is where the views are compared. The page has no view switcher of its own. A citation in the map, and an article in the list, open in the reader on this page. A path outside the source is refused and is not handed to the operating system. An empty source is a sentence: no map, no OKF bundle, or a missing directory.

When the selected path is the real path of the package root that ships the ZAM skill, a symlink to that root included, the switcher marks it **Skillquelle** (Skill source). That source shows this repository's own map, or the validation errors, and does not substitute an example map. A different clone is an ordinary Quelle.

Lehrplan hosts the existing curriculum browser in the Desktop window: school type, grade, subject, and the topics it already shows. Import and enrolment keep their current commands. Cancel starts the walk again while Lehrplan stays selected. Back on the first step leaves the browser open. The Lern-Karten header has no separate curriculum button. Onboarding and the active-path note point at Quellen → Lehrplan.

Quellen does not repair a workspace, link skills, write an OKF article, or write a knowledge map. Remembering a browsed region as new cards is not part of this page.

# The Studio panel

The Studio panel reaches the bridge through the app-only `zam_studio_bridge`, which a host also lets a model call ([ADR 2026-10-08b](../adr/2026-10-08b-corporate-deployment-baseline.md), Decision 3). On that path a Quelle is a workspace id: `learning-content-workspace --workspace <id>` resolves the root from the machine-local registry and returns the OKF catalog, one article whose real path is a non-reserved `*.md` inside `docs/okf`, or the validated map. A `map.json` that resolves outside the workspace counts as absent. No other file is read; a citation to one answers that it opens in ZAM Desktop.

The panel bridge does not offer `learning-content-browse` or `knowledge-map`, which take a path, and it refuses `learning-content-source --path` and `knowledge-map-feature --repo`. No `curriculum-*` command is on it. So the panel has no folder button and no curriculum browser; a stored folder and Lehrplan show the sentence that they open in ZAM Desktop, and the workspaces, their articles, and their maps keep working. The Desktop window runs the bridge directly and reads a Quelle by path, including other cited files inside it.

# Cards from an article

Browsing a source does not create tokens. An OKF article becomes learning tokens when an agent reads it, judges the concepts worth remembering, and records that decomposition through the import in [ADR 2026-07-18](../adr/2026-07-18-okf-learning-import.md), as [mcp-surfaces.md](mcp-surfaces.md) describes. File import, goal import, and photo or PDF import are unchanged.

# Citations

- [ADR 2026-10-10 — Learning Content: Cards and Sources](../adr/2026-10-10-learning-content-sources.md)
- [ADR 2026-10-08b — Corporate Deployment Baseline](../adr/2026-10-08b-corporate-deployment-baseline.md)
- [ADR 2026-06-30 — Learning Content Studio](../adr/2026-06-30-learning-content-studio.md)
- [ADR 2026-07-18 — Knowledge-to-Learning Import](../adr/2026-07-18-okf-learning-import.md)
- [ADR 2026-10-02 — Library Topics](../adr/2026-10-02-library-topics.md)
- [ADR 2026-10-03 — Repo Knowledge Map](../adr/2026-10-03-repo-knowledge-map.md)
- [ADR 2026-07-02 — LehrplanPLUS Curriculum Import Wizard](../adr/2026-07-02-lehrplanplus-import-wizard.md)
- [ADR 2026-06-25c — Flexible ZAM Workspaces and Skill Wiring](../adr/2026-06-25c-flexible-zam-workspaces-and-skill-wiring.md)
- Code: `desktop/src/learning-content.ts`, `desktop/src/learning-content-sources.ts`, `desktop/src/learning-content-knowledge.ts`, `desktop/src/curriculum-wizard.ts`, `desktop/index.html`, `desktop/src/panel/studio-panel.html`, `src/kernel/library/learning-content.ts`, `src/cli/learning-content/browse.ts`, `src/cli/learning-content/citation.ts`, `src/cli/provisioning/index.ts`, `src/cli/commands/bridge.ts`, `src/cli/commands/mcp.ts`
