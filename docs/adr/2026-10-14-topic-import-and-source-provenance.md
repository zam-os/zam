# Topic Import, and Where a Unit's Knowledge Comes From

**Status:** Proposed\
**Date:** 2026-10-14\
**Deciders:** Thomas (project owner)\
**Supersedes:** [2026-07-24](2026-07-24-first-run-onboarding.md) §3 (a goal
as an import path), and the goal page of its §1 and §2\
**Related:**
[2026-07-17](2026-07-17-okf-knowledge-base.md) (OKF articles as sources) ·
[2026-10-02](2026-10-02-library-topics.md) (library topics keyed by
`source_link`) ·
[2026-10-05](2026-10-05-learning-cards-from-photos-and-files.md) (Decision 9:
nothing of the material is stored, only a source row) ·
[2026-10-08b](2026-10-08b-corporate-deployment-baseline.md) (trusted paths,
`safeFetch`, model calls as egress) ·
[2026-10-10](2026-10-10-learning-content-sources.md) (Quellen) ·
[2026-10-13](2026-10-13-knowledge-atlas.md) (Decision 2: planets; Decision 9:
import at a place)

---

## Context

ADR 2026-07-24 §3 made a goal (*Lernziel*) a first-class import path. The
model breaks the goal down one level at a time, the learner confirms each
level, and every card cites the goal file as its `source_link`.

In practice the goal import became something smaller:

- **A learner writes a short topic.** It is one line and maybe a sentence of
  why, such as "Checkboxen bei Pull Requests in GitHub verändern" from the
  second Studio check of the atlas.
- **The model proposes subtopics and cards.** It suggests subtopics, and then
  cards for each subtopic the learner keeps.

That is a topic to learn or to consolidate. It is not a goal.

**Every import writes a goal file.** The file lands in the personal instance's
`goals/`, or wherever `personal.goals_dir` points. It holds a sentence and a
breakdown, which is not worth a file in the learner's repository. On
2026-10-13 two such files were even committed into the zam repository: a
machine with a POSIX shell resolved the Windows value of `personal.goals_dir`
from the shared library relative to its working directory.

**A goal in the first sense is something else.** It is the long-term
orientation of a life, and it does not fit into two or three tokens. An agent
acting as a tutor needs it to keep proposing tasks and fields of learning. A
form in a fixed application is the wrong place for it.

**The goal file as source says nothing about provenance.** The knowledge of a
goal import comes from the model, confirmed by the learner. Elsewhere the
source does tell where knowledge comes from: an OKF article, a curriculum
link, a material import.

**Today's mechanics:**

- `goal-create` writes the file.
- `personal-source-import --type file` caches it as a `sources` row.
- Each card links to that row through `token_sources`. The tokens'
  `source_link` stays empty.
- Library topics group tokens by `source_link` (2026-10-02).
- The review context resolves a `source_link`, and fetches it when it is a
  web link.

## Decisions

### 1. The goal import becomes the topic import

- **Name.** *Themen-Import* in German, *Topic import* in English. *Fachgebiet
  importieren* was considered.
- **What it is.** A topic in the learner's own words, to learn or to
  consolidate. The flow of 2026-07-24 §3 stays:
  - the model proposes subtopics one level at a time;
  - the learner keeps, deepens or stops;
  - cards are drafted per kept subtopic;
  - the learner picks the cards.
- **It writes no file.** Nothing goes into the personal instance or into
  `goals/`, and `personal.goals_dir` plays no part.
- **The import is recorded like a material import** (2026-10-05, Decision 9):
  - one `sources` row keyed `zam-topic:<ULID>`;
  - it holds the topic's title, the date and the learner, and nothing else of
    the description;
  - every card links to it through `token_sources`, so Learning Content can
    say where the cards came from.
- **It replaces the goal import everywhere:**
  - the Import menu;
  - the first-run flow (how, see Open question 2);
  - the default path of the free-learner persona;
  - the atlas, where *Hier importieren …* keeps *Fehlendes Wissen beschreiben*
    as its action and opens the topic import.
- **Old goal imports stay.** Existing goal files, and the cards that cite them,
  stay as they are. Nothing is deleted or migrated.

### 2. Goals return later, as knowledge for the tutor

- A goal is a learner's long-term orientation. It lives in the personal
  instance beside the beliefs (`goals/`), written by the learner alone or
  together with an agent.
- An agent acting as a tutor reads it to keep proposing tasks and fields of
  learning.
- `zam goal` and the goals engine stay unchanged. No import writes a goal. How
  a tutor reads goals is a later ADR.

### 3. A unit's source says where its knowledge comes from

A source answers one question: where did the knowledge of this unit come
from?

**A model knows nothing it could not read somewhere.** So an agent creates
tokens only from a source it read, and every token it writes cites that
source:

- **A file** in a repository: an OKF article, or another Markdown file.
- **The repository root**, when the knowledge comes from the repository as a
  whole rather than from one file.
- **A web page**, by its URL. When the cards come from a web source, that
  link is their source.

Without a source, an agent creates no token. The one exception is world
knowledge in a topic import (Decision 5): that is what a model learned from
public sources, and every card of it names where to read it up
(Decision 4).

A learner who writes a card by hand needs no source: the learner is the
source.

**Order of preference** for a source:

1. **A source ZAM can read without internet.** For example:
   - a file in a trusted folder or a repository Quelle, or the repository
     root;
   - a curriculum or a published cell in the library.

   This is the safest kind: it needs no network, sends nothing out, and stays
   readable.
2. **A stable public source on the web**, for world knowledge: a Wikipedia
   article, a published curriculum, open documentation.

The kind (the planet, 2026-10-13 Decision 2) limits what a source may be:

| Kind | Cites | Never cites |
|---|---|---|
| Weltwissen | a source without internet (1), or a public one (2) | a protected repository or a private file: a world unit may be published, and the link would leak and break for everyone else |
| Firma | the company's repository: a file or its root (1); a public page (2) where the knowledge comes from one | — |
| Privat | the learner's own files or notes (1) | — |

**ZAM checks what it can.** A local path must lie inside trusted folders, as
2026-10-08b already requires, and a URL must pass the `safeFetch` rules. The
rest is the tools' descriptions and the editorial release. The checks
themselves are planned with the agent tools of atlas Phase 9c.

### 4. Reading up is the learner's function, not a source

- **What it does.** For a world unit, the Studio offers *Nachlesen*. On the
  learner's click it opens the place to read the unit up, in the system
  browser.
- **A unit from a web source** opens that page: its source is the place to
  read it up.
- **Any other world unit** opens Wikipedia in the learner's language:
  - It opens a search that jumps straight to the article of that name
    (`Special:Search?search=…&go=Go`). So it never ends on a dead link, and
    ZAM fetches nothing beforehand.
  - The search term is the article name the model proposed for the subtopic
    in a topic import, and otherwise the unit's title.
  - The term is stored with the token as knowledge: shared, and part of its
    revision. A published atom without a term uses its title.
- **Wikipedia is the first reference work, not the only one.** Other
  reference works may follow, such as a children's encyclopedia for younger
  pupils (Open question 1).
- **World units only.** A Firma or Privat title never goes to a reference
  work on the web, not even on a click.
- **The Wikipedia search is not a `source_link`.** It forms no library topic
  (2026-10-02), no review fetches it, and nothing depends on the internet.
- **Where it shows:**
  - the atlas unit panel;
  - a review card's revealed answer, beside the Sinnbild;
  - the card in Lern-Karten.

### 5. The topic import writes world knowledge

- **Only world knowledge.** A topic import is the one path where a model
  writes from what it already knows. That is world knowledge, so everything
  a topic import creates is world knowledge.
  - Its units land on the world planet, sorted by their domain like any own
    world unit.
  - Each subtopic carries its search term for reading up (Decision 4).
- **Protected knowledge needs its source.** The model knows nothing about a
  company or a person. If it sees that a subtopic is about one, it says so,
  and the learner drops that subtopic. The learner can import it from its
  source instead:
  - a repository, through the agent (OKF import, 2026-07-18);
  - a file, a photo or a PDF, or typed notes (2026-10-05).
- **At an atlas place.** The topic import is offered at world regions. At a
  Firma or Privat region, *Hier importieren …* offers the imports that read
  a source.

## Consequences

**Easier**

- No file in the learner's repository for a sentence. A wrong
  `personal.goals_dir` can no longer place files from an import anywhere.
- The source tells where the knowledge came from, for every kind of import.
- A pupil can read up on any world unit. That needs neither an internet
  connection while learning nor a working link in the data.
- Kind and source line up for the editorial release: a world unit never
  carries a protected link.
- No model invents protected knowledge: what a company or a person knows
  enters only from where it is written down.

**Harder**

- Cards from a topic import still have no source that a review can read. That
  is true today as well, since their `source_link` is empty.
- A topic at a Firma or Privat place needs a source first; the topic import
  is not offered there.
- A Wikipedia search shows a results page when no article has the exact name.
- The search term is a new token field: a schema change, part of token
  revisions.

**Unchanged**

- `zam goal`, `goals/` in the personal instance.
- The material, file, curriculum and OKF imports.
- How a review reads an existing source.

## Alternatives considered

- **Keep the goal file and only rename the import.** Rejected: it keeps a
  file per sentence, and keeps the word "goal" for something that is not one.
- **A Wikipedia URL as `source_link`, checked by fetching it at import.**
  Rejected for three reasons:
  - it needs internet both at import and in every review that reads it;
  - it forms a library topic per article;
  - it sends titles out without the learner's click.
- **ZAM takes the first Wikipedia search hit as the source.** Rejected: it is
  often the wrong article, and it still needs internet.
- **Draft the cards from the Wikipedia text.** Not now: it needs internet and
  the licence's attribution (CC BY-SA). It may come later as an option.

## Open questions

1. **Reference works besides Wikipedia.** The owner is open to alternatives,
   such as a children's encyclopedia for younger pupils, or a choice by
   language. Which ones, and does the learner pick or does the persona?
2. **The first-run flow.** Today page 6 ("Woher sollen deine ersten Karten
   kommen?") offers four paths, and its fourth, "Aus einem Ziel", leads to
   page 7, a goal page every persona passes. With the topic import as one
   path among four, page 7 has no reason of its own. This is to be decided on
   example designs.

## Delivery

The changes land on PR #407, after atlas Phase 9b, each as its own commit:

1. **The topic import.**
   - The Studio's strings (en, de), the dialog, the first-run flow as Open
     question 2 settles it, and the persona default.
   - The bridge commands take the new name, and `goal-create` is retired.
   - The `zam-topic:<ULID>` source row.
   - Tests, and the OKF articles `learning-content` and `bridge-protocol`.
2. **Reading up on Wikipedia.** The token field and its migration, the term
   in the topic proposals, the Studio buttons, and tests.
3. **World knowledge only, and the source rules for agents** (Decisions 3
   and 5), with atlas Phase 9c.

## Status history

| Date | Status | Note |
|---|---|---|
| 2026-10-14 | Proposed | Owner direction: the goal import is a short topic and is demoted and renamed; goals return later as knowledge for an agent acting as tutor. A unit's source says where its knowledge comes from: world knowledge cites a stable source, preferably one readable without internet, company knowledge its repository or nothing. Reading up on Wikipedia is a function for the learner. Lands in PR #407. |
| 2026-10-14 | Proposed | Owner answers: a model knows nothing it could not read somewhere, so an agent creates tokens only from a source (a file such as an OKF article or other Markdown, the repository root, or a web page). The topic import therefore writes world knowledge only, and protected topics are imported from their source. A unit from a web source cites that link and reads up there. Open to reference works besides Wikipedia. The first-run pages are discussed on example designs. |
