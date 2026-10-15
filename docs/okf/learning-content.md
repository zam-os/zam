---
type: architecture
title: Learning Content
description: The Learning Content page opens on Lern-Karten, three lists of tokens and cards, and Quellen shows one workspace, folder, or curriculum at a time.
tags:
  - studio
  - learning-content
  - cards
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/learning-content.md"
timestamp: 2026-10-15T08:00:00.000Z
---

The Desktop Studio and the shared Studio panel both have a Learning Content page (Lerninhalte). The page opens on **Lern-Karten** (Learning cards). The other area is **Quellen** (Sources).

The actions that create or manage cards stay on Lern-Karten: a new card, topic import, photo or PDF, file import, library topics, and Bonus while items are kept. In the Desktop window the header shows **Neue Karte** (New card) and one **Importieren** (Import) menu that holds photo or PDF, library topics, **Themen-Import** (Topic import), and file import; Bonus sits beside them while items are kept.

The topic import ([ADR 2026-10-14](../adr/2026-10-14-topic-import-and-source-provenance.md)) replaced the goal import. It opens in a dialog of its own, with the same topic area as the first-run flow's topic page. That page follows only while the first-run content page's topic path is the one last chosen; choosing another path takes it out again.
- The learner names the topic, at most 200 characters, and a larger field takes context, prior knowledge and details. Example: PostgreSQL after projects only in Microsoft SQL Server, learned from the parallels and the differences.
- The model proposes subtopics one level at a time, then cards per kept subtopic. It keeps to what the topic names and adds something else only when it is indispensable for understanding. What the learner already knows is where it starts, never content. Without a context it starts from the foundations.
- From the first subtopic level, *Thema oder Kontext ändern* leads back to the name and the context, both kept.
- No file is written. One `zam-topic:` source row records the import. That row names the import, not a source to read up in, so Lern-Karten never offers it as a card's source link.
- A topic import writes world knowledge (Decision 5). Started outside the atlas, its new units land on the world planet, where Weltwissen's rules sort them by domain, even where no rule would otherwise cover them. On a team library placing them needs the right to write knowledge; without it the cards stay where Weltwissen's rules put them, and their `zam-topic:` source keeps them world knowledge either way.
- Each subtopic carries the Wikipedia article the model names for it, and its cards keep that article as their lookup term (Decision 4).
- The model knows only what is public. A subtopic about one company's or one person's own knowledge comes with the reason, unticked and locked, and with the hint to import it from its source: notes, a file or a repository (Decision 5).

The knowledge atlas opens the same dialog from a world region's **Hier importieren …** (*Fehlendes Wissen beschreiben*): the model is told where the cards will land, on a line of its own, never as prior knowledge, and the confirmed cards land there, each subtopic as the deepest level and the topic above it. If they cannot be put there, the result says so; the cards are kept. A Firma or Privat region does not offer it, since the model knows no company's or person's knowledge. Lehrplan, below, keeps the curriculum import and the enrolment of a learning path, and the menu has no curriculum entry.

# Nachlesen

**Nachlesen** (Read up, [ADR 2026-10-14](../adr/2026-10-14-topic-import-and-source-provenance.md), Decision 4) opens the place to read a world unit up, in the system browser, on the learner's click only. A unit whose source link is a web page opens that page; a curriculum page is no place to read up and does not count. Any other world unit opens a Wikipedia search in the learner's language (the unit's own language when it names one) that jumps straight to the article of its lookup term, else of its title. Nothing is fetched beforehand, and the search is never a source link. Firma and Privat units get no button: their titles never go to a reference work. The button shows in the atlas unit panel, beside the revealed answer of a review card, and in Lern-Karten's card editor.

# Lern-Karten

Lern-Karten has three lists. A token is in at most one of them.

**Persönlich** (Personal) is a published token for which this learner has a card, including a card set aside as "not for me". **Nicht gewählt** (Not chosen) is a published token with no card for this learner. Those tokens are grouped by the source link with the fragment removed. A token with no source link sits in the group **Ohne Quelle** (No source); the kernel returns an empty key and an empty name, and the Studio supplies the label. **Unveröffentlicht** (Unpublished) is a token in `draft` or `in_review`, whether or not this learner has a card. A deprecated token is in none of the three. A maintenance token stays in the list that its publication state and card imply.

Search and the category filter apply to the list that is open. The knowledge-context filter applies only while Persönlich is open; on the other two lists it is disabled.

**Wissensatlas** (knowledge atlas) is the map of the learner's knowledge, and Lern-Karten's button opens it, like the Desktop sidebar. The Studio panel has no map view, so it hides that button. The atlas took the place of **Wissensnetz (3D)**, the graph of the learner's tokens and their prerequisites. That graph is an alpha now: a switch in Settings, on this computer only, shows it in the sidebar again. Its Back button returns to Lern-Karten when it was opened while Lern-Karten was showing, and to **Heute** (Today) otherwise.

A published token in Nicht gewählt can be taken as this learner's card. One token is taken on its own, which creates the card and leaves the token as it is. A source group that has a key is taken together: a card is created for each member the learner lacks, and a card already set aside stays set aside. The Ohne Quelle group has an empty key, so those tokens are taken one by one.

**Formeln** (formulas, [ADR 2026-10-14b](../adr/2026-10-14b-card-formulas-images-and-spoken-text.md), Decision 9). The card editor shows a question or answer that holds formulas as the learner will see it, with each formula's spoken sentence below. The default edit is **Von der KI korrigieren lassen** (Let the AI fix it): one line in the learner's words; the model's correction appears as a preview to accept or discard, and nothing is saved until the card is. **Formel einfügen** (Insert formula) adds an empty formula with a TeX field, a live preview and a speech field. Curators find every formula's TeX and speech, and the text between them, under **Formelquelle** (Formula source). A side without formulas stays a plain text field. Saving sends the segments, or turns a side plain again when its last formula was removed; see [card-text-segments.md](card-text-segments.md).

# Quellen

Quellen shows one source at a time. The switcher is labeled **Quelle**. It lists every connected workspace, then **Lehrplan** (Curriculum). A picked folder is shown while it is the selected Quelle. The active workspace is what a read returns when nothing is stored, and that read does not write the choice. The choice is remembered on this machine under `learningContent` and does not change `knowledgeMap.repoPath`.

A folder that is not a workspace can be looked at in the Desktop window. Picking it does not add a workspace, link skills, or repair anything. A directory that is missing stays selectable, and the page says so.

For a workspace or a folder, the page lists that directory's OKF articles when `docs/okf/` is present. It also draws that directory's `docs/knowledge-map/map.json` across the page's full width, with the article list below it; no switch hides the map, and its module still loads only when a repository source is shown. The map offers its views in place (**Ansicht** / View), and the chosen view is remembered for the next map. Settings no longer lists the views. A citation in the map, and an article in the list, open in a reader dialog. A Markdown file is rendered, and a link inside it opens in the same dialog, resolved from that file's folder; any other file shows as text. A path or link outside the source is refused with a note in the dialog and is not handed to the operating system. An empty source is a sentence: no map, no OKF bundle, or a missing directory.

When the selected path is the real path of the package root that ships the ZAM skill, a symlink to that root included, the switcher marks it **Skillquelle** (Skill source). That source shows this repository's own map, or the validation errors, and does not substitute an example map. A different clone is an ordinary Quelle.

Lehrplan hosts the existing curriculum browser in the Desktop window: school type, grade, subject, and the topics it already shows. Import and enrolment keep their current commands. Cancel starts the walk again while Lehrplan stays selected. Back on the first step leaves the browser open. The Lern-Karten header has no separate curriculum button. Onboarding and the active-path note point at Quellen → Lehrplan.

Quellen does not repair a workspace, link skills, write an OKF article, or write a knowledge map. Remembering a browsed region as new cards is not part of this page.

# The Studio panel

The Studio panel reaches the bridge through the app-only `zam_studio_bridge`, which a host also lets a model call ([ADR 2026-10-08b](../adr/2026-10-08b-corporate-deployment-baseline.md), Decision 3). On that path a Quelle is a workspace id: `learning-content-workspace --workspace <id>` resolves the root from the machine-local registry and returns the OKF catalog, one article whose real path is a non-reserved `*.md` inside `docs/okf`, or the validated map. A `map.json` that resolves outside the workspace counts as absent. No other file is read; a citation to one answers that it opens in ZAM Desktop.

The panel bridge does not offer `learning-content-browse` or `knowledge-map`, which take a path, and it refuses `learning-content-source --path` and `knowledge-map-feature --repo`. No `curriculum-*` command is on it. So the panel has no folder button and no curriculum browser; a stored folder and Lehrplan show the sentence that they open in ZAM Desktop, and the workspaces, their articles, and their maps keep working. The Desktop window runs the bridge directly and reads a Quelle by path, including other cited files inside it.

# Cards from an article

Browsing a source does not create tokens. An OKF article becomes learning tokens when an agent reads it, judges the concepts worth remembering, and records that decomposition through the import in [ADR 2026-07-18](../adr/2026-07-18-okf-learning-import.md), as [mcp-surfaces.md](mcp-surfaces.md) describes. File import, topic import, and photo or PDF import are unchanged.

# Citations

- [ADR 2026-10-14b — Formulas, Images and Spoken Text in Cards](../adr/2026-10-14b-card-formulas-images-and-spoken-text.md)
- [ADR 2026-10-10 — Learning Content: Cards and Sources](../adr/2026-10-10-learning-content-sources.md)
- [ADR 2026-10-14 — Topic Import, and Where a Unit's Knowledge Comes From](../adr/2026-10-14-topic-import-and-source-provenance.md)
- [ADR 2026-10-08b — Corporate Deployment Baseline](../adr/2026-10-08b-corporate-deployment-baseline.md)
- [ADR 2026-06-30 — Learning Content Studio](../adr/2026-06-30-learning-content-studio.md)
- [ADR 2026-07-18 — Knowledge-to-Learning Import](../adr/2026-07-18-okf-learning-import.md)
- [ADR 2026-10-02 — Library Topics](../adr/2026-10-02-library-topics.md)
- [ADR 2026-10-03 — Repo Knowledge Map](../adr/2026-10-03-repo-knowledge-map.md)
- [ADR 2026-07-02 — LehrplanPLUS Curriculum Import Wizard](../adr/2026-07-02-lehrplanplus-import-wizard.md)
- [ADR 2026-06-25c — Flexible ZAM Workspaces and Skill Wiring](../adr/2026-06-25c-flexible-zam-workspaces-and-skill-wiring.md)
- Code: `desktop/src/learning-content.ts`, `desktop/src/topic-import.ts`, `desktop/src/onboarding.ts`, `src/kernel/import/topic-import.ts`, `src/kernel/models/token.ts`, `desktop/src/learning-content-sources.ts`, `desktop/src/learning-content-knowledge.ts`, `desktop/src/curriculum-wizard.ts`, `desktop/index.html`, `desktop/src/panel/studio-panel.html`, `src/kernel/library/learning-content.ts`, `src/cli/learning-content/browse.ts`, `src/cli/learning-content/citation.ts`, `src/cli/provisioning/index.ts`, `src/cli/commands/bridge.ts`, `src/cli/commands/mcp.ts`
