# Learning Content: Cards and Sources

**Status:** Accepted\
**Date:** 2026-10-10\
**Deciders:** Thomas (project owner)\
**Implementation plan:** [2026-10-10-learning-content-sources.md](../plans/2026-10-10-learning-content-sources.md)\
**Related:**
[2026-06-30](2026-06-30-learning-content-studio.md) (Learning Content page) ·
[2026-06-25c](2026-06-25c-flexible-zam-workspaces-and-skill-wiring.md) (workspace registry and the skill source) ·
[2026-07-02](2026-07-02-lehrplanplus-import-wizard.md) (curriculum wizard) ·
[2026-07-17](2026-07-17-okf-knowledge-base.md) (OKF articles as the source layer) ·
[2026-07-18](2026-07-18-okf-learning-import.md) (agent decomposes an article into tokens) ·
[2026-07-18b](2026-07-18b-graph-repo-scope.md) (learning graph scoped by a repo's articles) ·
[2026-10-02](2026-10-02-library-topics.md) (taking published tokens as cards) ·
[2026-10-03](2026-10-03-repo-knowledge-map.md) (alpha map and its views)

---

## Context

Learning Content is one page, and it currently does one job: the learner's
own cards. The list comes from `personal-card-list`, which joins tokens to
that learner's cards. A published token with no card is absent. A draft sits
in the same list as a published card whenever a card happens to exist.
Unpublished tokens without a card are absent too. `list-drafts` already
returns `draft` and `in_review`, and nothing on the page shows it.

Two other surfaces hold knowledge the learner cannot reach from this page:

| Surface | What it shows today | Where it lives |
|---|---|---|
| Wissensnetz (3D) | The learner's tokens and their prerequisites. German label „Wissensnetz (3D)“, `graph-view`. | A button on the dashboard. Back returns to the dashboard. |
| Wissenskarte | One repository's `docs/knowledge-map/map.json`, drawn as Fokus, Gliederung, Ebenen, Begriffskarte, C4, or one of the Gemini views. Citations open outside the Studio. | A top-nav entry, hidden until the alpha switch in Settings is on (ADR 2026-10-03, Decision 4). |

OKF articles of a repository are the source layer for learning cards
(ADR 2026-07-17, ADR 2026-07-18). The Studio does not list them. The
knowledge-map page loads one repository: the one an agent last wrote, or
the active workspace. The other configured workspaces are not offered.
A folder that is not a workspace cannot be opened there without becoming
the stored map repository. When a map is missing or invalid, the page
substitutes ZAM's own map and labels it an example.

The owner decided on 2026-10-10, after walking the page against those
surfaces:

1. The page is reorganised into two areas. The card area is separated into
   personal cards, tokens not yet chosen, and unpublished tokens.
2. The other area is named **Quellen**, with a switcher **Quelle**. „Import“
   stays the word for the actions that already create cards (file import,
   goal import, curriculum import).
3. The 3D surface to add is the existing Wissensnetz, not a new 3D drawing
   of the knowledge map.
4. One Quelle is active at a time. Every connected workspace is a choice.
   The active workspace is the default. A directory that is not a workspace
   can be opened and only looked at.
5. Looking at a repository is the same kind of activity as looking at a
   curriculum: pick a source, click through it, read it in the Studio.
   The repository shows the alpha views and its OKF articles. The
   curriculum shows the existing curriculum structure.
6. Building new cards out of a region the learner has just looked at is
   later work. This decision stops at reading.
7. When the chosen workspace is ZAM itself, it is still a Quelle. ZAM is
   the skill source. Looking at it must not repair the workspace, rewire
   skills, or write `docs/okf` or the knowledge map.

## Decisions

### 1. Learning Content has two areas

The page keeps its name (Lerninhalte / Learning Content) and its place in
the top navigation. Inside it, the learner moves between two areas:

| Area | German label | What it is |
|---|---|---|
| Cards | Lern-Karten | Tokens and the learner's cards. |
| Sources | Quellen | One source, looked at. |

Lern-Karten is the area the page opens on. The header actions that create
or manage cards stay on Lern-Karten: new card, goal import, photo/PDF,
file import, library topics. Quellen does not gain a second copy of them.

English UI strings follow the usual catalogues: „Learning cards“,
„Sources“, „Source“. The German labels above are the ones the owner chose.

### 2. Lern-Karten is three lists, and they do not overlap

The three lists partition the tokens this learner may see. Deprecated
tokens appear in none of them.

| List | German label | Membership |
|---|---|---|
| Personal | Persönlich | `editorial_state = published`, and a card row exists for this learner. A detached card stays here: a card exists. |
| Not chosen | Nicht gewählt | `editorial_state = published`, and no card row exists for this learner. |
| Unpublished | Unveröffentlicht | `editorial_state` is `draft` or `in_review`, whether or not a card exists. |

A token in maintenance stays in the list its publication state and card
already imply. The queue rules for maintenance are unchanged.

Nicht gewählt is grouped, not dumped. The group key is the library-topic
key of ADR 2026-10-02: `source_link` with the `#fragment` removed. Each
group shows the topic name and how many tokens the learner has not taken.
Tokens with no `source_link` form one group. Opening a group lists its
tokens.

Search and the category filter apply to whichever list is open. The
existing editor opens from any row. On Nicht gewählt the editor can take
the token with the paths that already exist: `startLibraryTopic` for a
group, and one card for a single token. That chooses a published token.
It does not decompose a source (Decision 10).

`personal-card-list` keeps its current result until the page asks for the
published-only list, so existing callers do not lose drafts in the same
change that adds the query.

### 3. The Wissensnetz opens from Lern-Karten

Lern-Karten offers the existing 3D graph (`graph-view`, „Wissensnetz (3D)“ /
„Knowledge Map (3D)“). It is the token graph the dashboard already opens.
The dashboard button stays.

Back returns to the place that opened the graph. From Lern-Karten it
returns to Lern-Karten. From the dashboard it returns to the dashboard.

### 4. A Quelle is one source, chosen from a switcher

The switcher lists:

- every workspace in the machine-local registry, with the active workspace
  selected by default;
- the curriculum, as its own entry (Decision 9);
- a folder the learner has picked that is not a workspace (Decision 5).

One entry is active. The picture on the page is that source alone.
Workspaces are not drawn together.

The choice is presentation state of this machine, stored beside the
knowledge-map settings in `~/.zam/config.json`. It is not learning data,
and it is not `knowledgeMap.repoPath`. Changing Quelle does not retarget
the repository an agent last wrote a map for.

The switcher reads the registry. It does not call workspace repair, and
it does not provision skills.

### 5. A folder that is not a workspace is only looked at

The learner can pick a directory that is not in the registry. The page
then treats that directory as the active Quelle.

Picking it does not add a workspace, does not link skills, and does not
repair anything. Closing the pick leaves the registry as it was. The
path may be remembered as the current Quelle (Decision 4) so a restart
opens the same folder.

### 6. A repository Quelle is browsed like the companion, and read in the Studio

For a workspace or a picked folder the page shows what that directory
holds:

- its knowledge map, when `docs/knowledge-map/map.json` is present, drawn
  with the view chosen in Settings (Fokus, Gliederung, Ebenen,
  Begriffskarte, C4, Gemini);
- its OKF articles, when `docs/okf/` is present, as a list.

A citation in the map and an article in the list open in a reader on this
page. OKF articles use the existing OKF reader. Any other file the map
cites (an ADR, a `beliefs/` file, a repository file) is shown as text in
the same reader. The page does not hand the file to the operating system
as the primary action.

An empty source is a sentence, not a blank page. No map, no OKF bundle,
or a directory that has gone missing: the page says which, and the
switcher stays usable.

While the alpha switch is off, the map views stay unloaded
(ADR 2026-10-03, Decision 4). The OKF list and the switcher still show.
One action on the page turns the existing switch on. The page does not
grow its own view switcher; Settings remains where views are compared.

The top-nav entry „Wissenskarte“ is removed once Quellen can open the
same views. Lerninhalte is the Studio door. The companion panels are
unchanged: they keep reading the folder the editor has open.

For every Quelle except the skill source (Decision 8), a missing or
invalid map still falls back to ZAM's own map labeled as an example, as
the map page does today.

### 7. This surface never writes a source

Quellen reads. From this page the Studio does not repair a workspace,
does not link or relink skills, does not call the OKF upsert, and does
not write a knowledge map. Authoring stays on the agent tools that
already own those files.

The refusal holds for every Quelle, including an ordinary workspace and
a picked folder.

### 8. ZAM as a workspace is the skill source, and is still a Quelle

When the selected path is the package root that ships the ZAM skill —
the developer checkout or the installed package, compared by real path,
so a symlink to that root counts — the switcher marks it as the skill
source.

Viewing it uses the same read path as any other repository Quelle.
Decision 7 applies, as it does everywhere on this page. In addition, the
example-map fallback of Decision 6 does not apply: the page shows this
repository's own map, or the real validation errors. It does not present
that map a second time under an „example“ notice.

A different clone of ZAM is an ordinary Quelle. It is not the skill
source unless its real path is the package root.

### 9. A curriculum is a Quelle

„Lehrplan“ is an entry in the same switcher. Choosing it opens the
existing curriculum browser: school type, grade, subject, and the topics
already shown today. The interaction matches a repository Quelle in the
only way the two share: pick, click through, read.

The actions that create cards keep the names they have (curriculum
import, activating a learning path) and their current behavior. Once
this entry works, the curriculum button on the Lern-Karten header is
removed, so the curriculum has one door.

### 10. Remembering a region is a later decision

This ADR does not create tokens from a map selection, an article, or a
curriculum section. Decomposition stays with the agent
(ADR 2026-07-18): the learner reads here, and an import that already
exists keeps doing what it does.

Taking a published token that has no card yet (Decision 2) is in scope,
because that token already exists. Turning a passage the learner just
read into new cards needs its own decision.

## Consequences

**Easier**

- The learner finds cards, untaken tokens, and drafts as three lists.
- The Wissensnetz is on the page that holds the cards it draws.
- Every connected workspace, a folder that is not a workspace, and the
  curriculum are reached from one switcher.
- Map citations and OKF articles open in the Studio.
- Choosing the ZAM checkout cannot repair it or overwrite its skill,
  its articles, or its map.

**Harder**

- The Learning Content page, the shared Studio panel, and the bridge
  allowlist change together.
- The alpha switch still hides the map views until the learner turns
  them on. The one action that does this has to be obvious.
- `personal-card-list` gains a published-only mode without changing the
  result its current callers receive.

**Unchanged**

- The token/card split, editorial states, and publication checks.
- The agent OKF import, file import, goal import, and photo/PDF import.
- The knowledge-map file format, the view registry, and the Settings
  list of views.
- The companion panels.
- No schema change and no new dependency.

## Code

Implementation follows
[the plan](../plans/2026-10-10-learning-content-sources.md). The lists
belong in the kernel and are re-exported from `src/kernel/index.ts`.
Reading a repository stays in the CLI layer, which already loads the
map and the OKF bundle. The Studio calls the bridge.
